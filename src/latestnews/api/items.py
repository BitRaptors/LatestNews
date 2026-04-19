"""`POST /api/items` — the capture ingest endpoint.

Accepts either `application/json` (body: `{"url": str}`) or
`multipart/form-data` (fields: `file`, optional `source_type`). FastAPI
can't natively dispatch by content-type on a single path, so this router
parses `Content-Type` and branches to the right helper.

Errors follow the architecture's envelope:
    { "error": { "code": "ingest.xxx", "message": "...", "hint": "..." } }
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, StringConstraints, ValidationError
from starlette.datastructures import UploadFile

from latestnews.events.bus import EventBus
from latestnews.ingest.coordinator import (
    CaptureResponse,
    IngestWriteError,
    ingest_file,
    ingest_url,
)
from latestnews.settings import Settings

router = APIRouter(prefix="/api", tags=["items"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class CaptureUrlBody(BaseModel):
    """JSON body shape for URL / text captures.

    `StringConstraints(strip_whitespace=True, min_length=1)` collapses the
    two 422 paths (empty vs whitespace-only) into one: pydantic trims first,
    then applies the length check. No need for a post-parse re-strip in the
    handler.
    """

    url: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _error_envelope(
    status_code: int,
    *,
    code: str,
    message: str,
    hint: str,
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "hint": hint}},
    )


_SOURCE_TYPE_BY_MIME: dict[str, Literal["pdf", "image", "markdown", "text"]] = {
    "application/pdf": "pdf",
    "text/markdown": "markdown",
    "text/x-markdown": "markdown",
}


def _infer_source_type(
    content_type: str | None,
) -> Literal["pdf", "image", "markdown", "text"]:
    if not content_type:
        return "text"
    lowered = content_type.lower().split(";", 1)[0].strip()
    if lowered in _SOURCE_TYPE_BY_MIME:
        return _SOURCE_TYPE_BY_MIME[lowered]
    if lowered.startswith("image/"):
        return "image"
    return "text"


_ALLOWED_SOURCE_TYPES: frozenset[str] = frozenset(
    {"pdf", "image", "markdown", "text"},
)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/items",
    status_code=201,
    response_model=None,  # We return a dict — no pydantic serialization.
)
async def post_items(request: Request) -> dict[str, str]:
    """Branch on Content-Type and dispatch to the right coordinator helper."""
    settings: Settings = request.app.state.settings
    events = request.app.state.events
    data_root = settings.resolved_data_root()

    content_type = (request.headers.get("content-type") or "").lower()

    try:
        response = await _dispatch(
            request,
            content_type=content_type,
            data_root=data_root,
            events=events,
        )
    except IngestWriteError as exc:
        raise _error_envelope(
            500,
            code=exc.code,
            message=str(exc),
            hint=exc.hint,
        ) from exc

    return {"id": response.id, "status": response.status}


async def _dispatch(
    request: Request,
    *,
    content_type: str,
    data_root: Path,
    events: EventBus,
) -> CaptureResponse:
    if content_type.startswith("application/json"):
        return await _handle_json(request, data_root=data_root, events=events)
    if content_type.startswith("multipart/form-data"):
        return await _handle_multipart(
            request, data_root=data_root, events=events
        )
    # Unknown / missing content-type — validation failure.
    raise _error_envelope(
        422,
        code="ingest.validation_failed",
        message=(
            f"Unsupported Content-Type: {content_type or '(missing)'}. "
            "Expected application/json or multipart/form-data."
        ),
        hint="Send JSON with a url field, or a multipart form with a file field.",
    )


async def _handle_json(
    request: Request,
    *,
    data_root: Path,
    events: EventBus,
) -> CaptureResponse:
    try:
        raw = await request.json()
    except ValueError as exc:
        raise _error_envelope(
            422,
            code="ingest.validation_failed",
            message=f"Invalid JSON body: {exc}",
            hint="Send a JSON object like {\"url\": \"...\"}.",
        ) from exc

    try:
        body = CaptureUrlBody.model_validate(raw)
    except ValidationError as exc:
        raise _error_envelope(
            422,
            code="ingest.validation_failed",
            message=exc.errors()[0].get("msg", "Invalid request body."),
            hint="Provide a non-empty `url` string.",
        ) from exc

    return await ingest_url(data_root=data_root, events=events, url=body.url)


async def _handle_multipart(
    request: Request,
    *,
    data_root: Path,
    events: EventBus,
) -> CaptureResponse:
    form = await request.form()
    file_field = form.get("file")
    if not isinstance(file_field, UploadFile):
        raise _error_envelope(
            422,
            code="ingest.validation_failed",
            message="Multipart body missing required `file` field.",
            hint="Include a file field in the multipart form.",
        )

    explicit_source = form.get("source_type")
    if isinstance(explicit_source, str) and explicit_source:
        if explicit_source not in _ALLOWED_SOURCE_TYPES:
            raise _error_envelope(
                422,
                code="ingest.validation_failed",
                message=(
                    f"Invalid source_type: {explicit_source!r}. "
                    f"Allowed: {sorted(_ALLOWED_SOURCE_TYPES)}."
                ),
                hint="Omit source_type or send one of pdf/image/markdown/text.",
            )
        source_type: Literal["pdf", "image", "markdown", "text"] = explicit_source  # type: ignore[assignment]
    else:
        source_type = _infer_source_type(file_field.content_type)

    return await ingest_file(
        data_root=data_root,
        events=events,
        source_type=source_type,
        filename=file_field.filename,
    )

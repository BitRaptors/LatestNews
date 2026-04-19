"""Ingest coordinator — write-stub-then-emit orchestrator.

Thin glue between the HTTP endpoint, `fs.writer`, and the event bus. Does
not invoke plugins or enrichment — those land in Epic 3. For now every
capture produces a durable stub (NFR-R1) and emits `ingest.progress
queued` so future consumers can subscribe before the real pipeline exists.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

import structlog
import uuid_utils

from latestnews._time import utc_now_iso_millis
from latestnews.events.bus import EventBus
from latestnews.events.types import IngestProgressEvent
from latestnews.fs.writer import write_item_stub

_log = structlog.get_logger(__name__)


class IngestWriteError(Exception):
    """Raised when the coordinator fails to write a stub to disk."""

    code: Literal["ingest.write_failed"] = "ingest.write_failed"
    hint: str = "Failed to save item. Retry or check logs."


class CaptureResponse:
    """Plain container — FastAPI serialises via `__dict__`."""

    __slots__ = ("id", "status")

    def __init__(self, id: str, status: Literal["queued"]) -> None:  # noqa: A002
        self.id = id
        self.status = status


def _fallback_title_from_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if host:
            return host
    except ValueError:
        pass
    return url[:40] if url else "Untitled Item"


def _fallback_title_from_filename(filename: str | None) -> str:
    if not filename:
        return "Untitled Item"
    stem = Path(filename).stem
    return stem or "Untitled Item"


async def _emit_queued(bus: EventBus, item_id: str) -> None:
    event: IngestProgressEvent = {
        "type": "ingest.progress",
        "payload": {"item_id": item_id, "state": "queued"},
        "meta": {"timestamp": utc_now_iso_millis()},
    }
    await bus.publish(event)


async def ingest_url(
    *,
    data_root: Path,
    events: EventBus,
    url: str,
) -> CaptureResponse:
    """Write a stub for a URL/text capture and emit `queued`."""
    item_id = str(uuid_utils.uuid7())
    started = time.perf_counter()
    try:
        path = write_item_stub(
            data_root,
            item_id=item_id,
            source="url",
            source_type="url_html",
            title=_fallback_title_from_url(url),
        )
    except OSError as exc:
        _log.error("capture.write_failed", url=url, error=str(exc))
        raise IngestWriteError(str(exc)) from exc

    latency_ms = (time.perf_counter() - started) * 1000.0
    _log.info(
        "capture.received",
        item_id=item_id,
        source="url",
        path=str(path),
        latency_ms=round(latency_ms, 2),
    )
    await _emit_queued(events, item_id)
    return CaptureResponse(id=item_id, status="queued")


async def ingest_file(
    *,
    data_root: Path,
    events: EventBus,
    source_type: Literal["pdf", "image", "markdown", "text"],
    filename: str | None,
) -> CaptureResponse:
    """Write a stub for a file capture and emit `queued`.

    For Story 2.2 we do not yet persist the file bytes to disk — plugins
    (Epic 3) will own that. The stub records the capture intent; the real
    file body is consumed by the enrichment layer when it arrives.
    """
    item_id = str(uuid_utils.uuid7())
    started = time.perf_counter()
    try:
        path = write_item_stub(
            data_root,
            item_id=item_id,
            source="file",
            source_type=source_type,
            title=_fallback_title_from_filename(filename),
        )
    except OSError as exc:
        _log.error(
            "capture.write_failed", filename=filename, error=str(exc)
        )
        raise IngestWriteError(str(exc)) from exc

    latency_ms = (time.perf_counter() - started) * 1000.0
    # NOTE: Story 2.2 persists the stub only — the uploaded file body is
    # intentionally discarded. Plugin stories (Epic 3) receive the bytes
    # directly via the ingest pipeline. Log it so nobody mistakes the
    # missing payload for a bug.
    _log.info(
        "capture.received",
        item_id=item_id,
        source="file",
        source_type=source_type,
        filename=filename,
        path=str(path),
        latency_ms=round(latency_ms, 2),
        file_body_discarded=True,
    )
    await _emit_queued(events, item_id)
    return CaptureResponse(id=item_id, status="queued")

"""Contract tests for `POST /api/items`."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
import yaml
from httpx import ASGITransport, AsyncClient

from latestnews.app import create_app
from latestnews.events.bus import create_bus
from latestnews.settings import Settings, get_settings


@pytest.fixture()
def data_root(tmp_path: Path) -> Path:
    return tmp_path


@pytest.fixture()
def app_with_tmp_root(data_root: Path) -> Iterator:
    """FastAPI app with Settings + EventBus injected for tests.

    Starlette only runs the app's lifespan when ASGI serves it — under
    `ASGITransport` (httpx) it is **not** invoked, so `app.state.events`
    stays unset unless we attach it manually. Mirror the lifespan's setup.
    """
    app = create_app()
    app.dependency_overrides[get_settings] = lambda: Settings(data_root=data_root)
    app.state.settings = Settings(data_root=data_root)
    app.state.events = create_bus()
    yield app
    app.dependency_overrides.clear()


async def _client(app) -> AsyncClient:
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://testserver")


def _only_md_file(data_root: Path) -> Path:
    files = list(data_root.glob("*.md"))
    assert len(files) == 1, f"expected 1 stub, found: {files}"
    return files[0]


async def test_post_items_json_returns_201_with_uuid7(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items", json={"url": "https://example.com/story"}
        )
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "status"}
    assert body["status"] == "queued"
    assert len(body["id"]) >= 32  # UUIDv7 hex with dashes = 36 chars


async def test_post_items_json_writes_stub_with_frontmatter(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items", json={"url": "https://example.com/hello"}
        )
    assert response.status_code == 201

    stub = _only_md_file(data_root)
    body = stub.read_text(encoding="utf-8")
    assert body.startswith("---\n")
    end = body.index("\n---\n", 4)
    fm = yaml.safe_load(body[4:end])

    assert fm["id"] == response.json()["id"]
    assert fm["schema_version"] == 1
    assert fm["source"] == "url"
    assert fm["source_type"] == "url_html"
    assert fm["sensitivity"] == "personal"
    assert fm["title"] == "example.com"
    assert fm["created_at"].endswith("Z")


async def test_post_items_empty_url_returns_422_envelope(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post("/api/items", json={"url": ""})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["error"]["code"] == "ingest.validation_failed"


async def test_post_items_missing_content_type_returns_422(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items", content=b"raw body", headers={"content-type": "text/plain"}
        )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["error"]["code"] == "ingest.validation_failed"


async def test_post_items_multipart_pdf_returns_201(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items",
            files={
                "file": ("report.pdf", b"%PDF-1.4 fake", "application/pdf"),
            },
            data={"source_type": "pdf"},
        )
    assert response.status_code == 201
    stub = _only_md_file(data_root)
    fm = yaml.safe_load(
        stub.read_text(encoding="utf-8").split("---\n", 2)[1]
    )
    assert fm["source"] == "file"
    assert fm["source_type"] == "pdf"
    assert fm["title"] == "report"


async def test_post_items_multipart_without_source_type_infers_from_mime(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items",
            files={
                "file": ("photo.png", b"\x89PNG...", "image/png"),
            },
        )
    assert response.status_code == 201
    stub = _only_md_file(data_root)
    fm = yaml.safe_load(
        stub.read_text(encoding="utf-8").split("---\n", 2)[1]
    )
    assert fm["source_type"] == "image"


async def test_post_items_multipart_unknown_mime_falls_back_to_text(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items",
            files={
                "file": (
                    "weird.bin",
                    b"data",
                    "application/x-totally-novel",
                ),
            },
        )
    assert response.status_code == 201
    stub = _only_md_file(data_root)
    fm = yaml.safe_load(
        stub.read_text(encoding="utf-8").split("---\n", 2)[1]
    )
    assert fm["source_type"] == "text"


async def test_post_items_multipart_invalid_source_type_returns_422(
    app_with_tmp_root, data_root: Path
) -> None:
    async with await _client(app_with_tmp_root) as client:
        response = await client.post(
            "/api/items",
            files={"file": ("x.txt", b"hi", "text/plain")},
            data={"source_type": "garbage"},
        )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["error"]["code"] == "ingest.validation_failed"

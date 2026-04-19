"""Contract tests for the `/api/events` SSE transport.

We test the two layers directly (frame formatting + streaming generator)
rather than via an HTTP stream. Reason: `httpx.ASGITransport` buffers the
response body until the generator completes, which deadlocks when the
generator awaits `queue.get()` indefinitely waiting for a publisher that
can't run (single-threaded event loop). Real client consumption is
exercised by Playwright E2E tests in a later story.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

from latestnews.api.events import _event_stream, _format_sse
from latestnews.app import create_app
from latestnews.events.bus import create_bus
from latestnews.events.types import IngestProgressEvent
from latestnews.settings import Settings

_SAMPLE_EVENT: IngestProgressEvent = {
    "type": "ingest.progress",
    "payload": {"item_id": "018f-test", "state": "queued"},
    "meta": {"timestamp": "2026-04-19T00:00:00.000Z"},
}


def test_format_sse_produces_spec_compliant_frame() -> None:
    frame = _format_sse(_SAMPLE_EVENT)
    assert frame.startswith("event: ingest.progress\n")
    assert "data: " in frame
    assert frame.endswith("\n\n")
    data_line = next(
        line for line in frame.splitlines() if line.startswith("data: ")
    )
    payload = json.loads(data_line.removeprefix("data: "))
    assert payload == _SAMPLE_EVENT


@pytest.mark.asyncio
async def test_event_stream_emits_frames_from_bus(tmp_path: Path) -> None:
    """The generator subscribes to the bus; published events become frames."""
    app = create_app()
    app.state.settings = Settings(data_root=tmp_path)
    app.state.events = create_bus()
    bus = app.state.events

    # Fake Request — only .is_disconnected() is used by the generator.
    request = AsyncMock()
    request.is_disconnected = AsyncMock(return_value=False)

    async def drive() -> str:
        gen = _event_stream(bus, request)
        # Give the subscriber a tick to register before publishing.
        await asyncio.sleep(0)
        asyncio.create_task(bus.publish(_SAMPLE_EVENT))
        return await gen.__anext__()

    frame = await asyncio.wait_for(drive(), timeout=2.0)
    assert "event: ingest.progress" in frame
    payload_line = next(
        line for line in frame.splitlines() if line.startswith("data: ")
    )
    assert json.loads(payload_line.removeprefix("data: ")) == _SAMPLE_EVENT


@pytest.mark.asyncio
async def test_event_stream_stops_on_client_disconnect(tmp_path: Path) -> None:
    """If the client is already disconnected, the generator exits cleanly."""
    app = create_app()
    app.state.settings = Settings(data_root=tmp_path)
    app.state.events = create_bus()

    request = AsyncMock()
    request.is_disconnected = AsyncMock(return_value=True)

    gen = _event_stream(app.state.events, request)
    # The generator should yield nothing and exhaust immediately.
    with pytest.raises(StopAsyncIteration):
        await asyncio.wait_for(gen.__anext__(), timeout=2.0)

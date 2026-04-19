"""`GET /api/events` — Server-Sent Events stream over the internal bus.

Subscribes to the in-process `EventBus` and serialises each event as an
SSE frame. Clients reconnect on disconnect (frontend responsibility —
Story 2.4 adds the consumer). No periodic keep-alive ping yet; add one if
proxy timeouts become a real issue.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from latestnews.events.bus import EventBus
from latestnews.events.types import Event

router = APIRouter(prefix="/api", tags=["events"])


def _format_sse(event: Event) -> str:
    """Encode a single event as an SSE frame.

    Format:
        event: <type>\n
        data: <json>\n
        \n
    """
    return f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"


async def _event_stream(bus: EventBus, request: Request) -> AsyncIterator[str]:
    """Async generator consumed by StreamingResponse.

    Terminates cleanly when the client disconnects — Starlette raises
    `asyncio.CancelledError` inside the generator.
    """
    async with bus.subscribe() as queue:
        try:
            while True:
                if await request.is_disconnected():
                    return
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                except TimeoutError:
                    # Idle — loop back to re-check client disconnect. A
                    # future story can emit a `: ping` comment frame here
                    # if proxy timeouts become an issue.
                    continue
                yield _format_sse(event)
        except asyncio.CancelledError:
            # Client went away; let the context manager clean up.
            return


@router.get("/events")
async def get_events(request: Request) -> StreamingResponse:
    bus: EventBus = request.app.state.events
    return StreamingResponse(
        _event_stream(bus, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            # Disable proxy buffering (e.g. nginx) so events flush promptly.
            "X-Accel-Buffering": "no",
        },
    )

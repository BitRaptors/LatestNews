"""In-process async pub-sub.

One bus instance lives on `app.state.events` (created in the FastAPI
lifespan). Publishers call `publish(event)`; subscribers call
`subscribe()` and iterate. Each subscriber holds its own `asyncio.Queue`
so slow consumers don't block publishers — if a queue fills, the event is
dropped for that subscriber (warned in logs). Progress events are advisory,
not guaranteed-delivery; the durable receipt is the stub file on disk.

SSE transport is `api/events.py`; this module is pure async primitives.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Final

import structlog

from .types import Event

_log = structlog.get_logger(__name__)

# Per-subscriber queue ceiling. Matches Vite's event backpressure — 128
# pending progress events is plenty for the UX ingest pipeline.
_QUEUE_MAXSIZE: Final = 128


class EventBus:
    """Fan-out publisher. Safe for concurrent `publish` + multiple subscribers."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[Event]] = set()
        self._lock = asyncio.Lock()

    async def publish(self, event: Event) -> None:
        """Fan out to every subscriber without blocking.

        Full-queue subscribers drop the event and log — we prefer partial
        progress over blocking the ingest hot path.
        """
        async with self._lock:
            queues = tuple(self._subscribers)
        for q in queues:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                _log.warning(
                    "event.bus.queue_full",
                    event_type=event["type"],
                    queue_maxsize=_QUEUE_MAXSIZE,
                )

    @asynccontextmanager
    async def subscribe(self) -> AsyncIterator[asyncio.Queue[Event]]:
        """Context-managed subscription. Iterate the queue to receive events.

        Usage
        -----
        ```
        async with bus.subscribe() as q:
            while True:
                event = await q.get()
                ...
        ```

        Unsubscribes automatically on exit (including cancellation).
        """
        q: asyncio.Queue[Event] = asyncio.Queue(maxsize=_QUEUE_MAXSIZE)
        async with self._lock:
            self._subscribers.add(q)
        try:
            yield q
        finally:
            async with self._lock:
                self._subscribers.discard(q)


def create_bus() -> EventBus:
    """Factory used by the FastAPI lifespan. Keeps test setup symmetric."""
    return EventBus()

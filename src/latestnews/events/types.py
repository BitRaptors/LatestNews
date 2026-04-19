"""Event envelope types for the in-process pub-sub bus."""

from __future__ import annotations

from typing import Literal, TypedDict

IngestState = Literal[
    "queued",
    "fetching",
    "parsing",
    "summarizing",
    "indexed",
]


class IngestProgressMeta(TypedDict):
    timestamp: str  # ISO 8601 UTC with millisecond precision + Z


class IngestProgressPayload(TypedDict):
    item_id: str  # UUIDv7 string
    state: IngestState


class IngestProgressEvent(TypedDict):
    """Emitted each time an ingest item advances a state.

    Story 2.2 only publishes `queued`. Epic 3's enrichment worker publishes
    the rest (`fetching` through `indexed`).
    """

    type: Literal["ingest.progress"]
    payload: IngestProgressPayload
    meta: IngestProgressMeta


# Discriminated union for future event types (chat.token, capture.failed, …).
# For now the bus publishes only IngestProgressEvent — keep the alias so
# every call site that expects a generic event has a single name to import.
Event = IngestProgressEvent

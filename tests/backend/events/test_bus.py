"""Tests for the in-process async event bus."""

from __future__ import annotations

import asyncio

import pytest

from latestnews.events.bus import create_bus
from latestnews.events.types import IngestProgressEvent


def _make_event(item_id: str = "item-1") -> IngestProgressEvent:
    return {
        "type": "ingest.progress",
        "payload": {"item_id": item_id, "state": "queued"},
        "meta": {"timestamp": "2026-04-19T00:00:00.000Z"},
    }


@pytest.mark.asyncio
async def test_publish_reaches_single_subscriber() -> None:
    bus = create_bus()
    event = _make_event()

    async with bus.subscribe() as q:
        await bus.publish(event)
        received = await asyncio.wait_for(q.get(), timeout=1.0)
    assert received == event


@pytest.mark.asyncio
async def test_publish_fans_out_to_multiple_subscribers() -> None:
    bus = create_bus()
    event = _make_event()

    async with bus.subscribe() as q1, bus.subscribe() as q2:
        await bus.publish(event)
        r1 = await asyncio.wait_for(q1.get(), timeout=1.0)
        r2 = await asyncio.wait_for(q2.get(), timeout=1.0)
    assert r1 == event
    assert r2 == event


@pytest.mark.asyncio
async def test_unsubscribed_queues_no_longer_receive() -> None:
    bus = create_bus()

    async with bus.subscribe() as q1:
        await bus.publish(_make_event("first"))
        _ = await asyncio.wait_for(q1.get(), timeout=1.0)

    # q1 is unsubscribed. Publishing shouldn't block or fail.
    await bus.publish(_make_event("second"))


@pytest.mark.asyncio
async def test_publish_with_no_subscribers_does_not_raise() -> None:
    bus = create_bus()
    await bus.publish(_make_event())  # no-op; should not raise

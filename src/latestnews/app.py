"""FastAPI application factory.

Story 1.1 wired `/api/health`. Story 2.2 adds:
  - `Settings` singleton attached to `app.state.settings`
  - `EventBus` singleton attached to `app.state.events`
  - `POST /api/items` ingest endpoint
  - `GET  /api/events` SSE stream
  - Lifespan that ensures `data_root` exists before the app accepts traffic

Keep this file focused on composition — routers + wiring. Feature logic
lives in its subsystem modules (`ingest/`, `fs/`, `events/`).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from latestnews.api import events, health, items
from latestnews.events.bus import create_bus
from latestnews.settings import get_settings

DEV_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def _configure_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(DEV_ORIGINS),
        # No session cookies or bearer tokens yet → credentials disabled.
        # Flip to True (and narrow origins) when auth lands.
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Accept"],
    )


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Boot: ensure data_root + bus singleton. Shutdown: nothing to release."""
    settings = get_settings()
    data_root = settings.resolved_data_root()
    data_root.mkdir(parents=True, exist_ok=True)
    if not data_root.is_dir():
        raise RuntimeError(f"data_root is not a directory: {data_root}")

    app.state.settings = settings
    app.state.events = create_bus()
    yield
    # No teardown — the bus is in-process; subscribers clean up via their
    # own context managers.


def create_app() -> FastAPI:
    app = FastAPI(title="LatestNews", version="0.1.0", lifespan=_lifespan)
    _configure_cors(app)
    app.include_router(health.router)
    app.include_router(items.router)
    app.include_router(events.router)
    return app

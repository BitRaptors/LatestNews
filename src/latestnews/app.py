"""FastAPI application factory.

Intentionally thin — Story 1.1 only wires the `/api/health` probe. Later
stories add routers, middleware, and the event bus; keep this file focused
on composition, not feature logic.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from latestnews.api import health

DEV_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def _configure_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(DEV_ORIGINS),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Accept"],
    )


def create_app() -> FastAPI:
    app = FastAPI(title="LatestNews", version="0.1.0")
    _configure_cors(app)
    app.include_router(health.router)
    return app

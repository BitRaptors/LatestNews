"""Health-probe router.

Used by the Vite dev proxy and production uptime checks. Intentionally
minimal — returns a static payload so it can confirm the app is mounted
without touching any downstream subsystem.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

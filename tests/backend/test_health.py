"""Contract test for the /api/health endpoint.

Story 1.1 AC #3 / #5: the FastAPI app factory exposes a synchronous health
probe that the Vite dev proxy (and later the production server) can poll.
"""

from httpx import ASGITransport, AsyncClient

from latestnews.app import create_app


async def test_health_returns_ok() -> None:
    app = create_app()
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

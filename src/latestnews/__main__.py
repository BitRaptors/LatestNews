"""Entry point for `python -m latestnews`.

Binds uvicorn to 127.0.0.1 (NFR-S1 — no inbound network port outside
localhost) using the FastAPI app factory.
"""

import uvicorn


def main() -> None:
    uvicorn.run(
        "latestnews.app:create_app",
        factory=True,
        host="127.0.0.1",
        port=8000,
        reload=False,
    )


if __name__ == "__main__":
    main()

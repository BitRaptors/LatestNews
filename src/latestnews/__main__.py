"""Entry point for `python -m latestnews`.

Production-style launcher: binds uvicorn to 127.0.0.1 (NFR-S1 — no
inbound network port outside localhost) using the FastAPI app factory,
with **no auto-reload**. For dev-mode with HMR, use `npm run dev` at
the repo root — it wires `--reload` via the concurrently command.
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

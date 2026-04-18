# web/

LatestNews frontend — Vite + React 19 + TypeScript (strict).

For dev/build/lint/typecheck/test, use the **repo-root** `npm run …` scripts.
They orchestrate the backend (FastAPI) and frontend together. See the
repository root `AGENTS.md` for the full developer guide.

- `npm run dev` (from repo root) — launches uvicorn + Vite concurrently.
- `npm run typecheck --prefix web` — runs `tsc -b --noEmit` in this folder.

Linting and formatting are handled by Biome at the repo root; no ESLint
config lives here.

# AGENTS.md — LatestNews developer guide

> This document is authoritative (NFR-Q4). PRs that land new subsystems or
> public interfaces **must** update the relevant section here; the section
> headings below are the contract.
>
> Story 1.1 ships this as a stub — each subsequent story enriches the
> matching section. If you add new code and don't know where to document
> it, add a new section rather than leaving the gap.

## What this is

LatestNews is a local-first, file-based personal knowledge web application.
Paste any link, PDF, image, or text — it becomes searchable markdown with AI
summaries. The primary value is **rediscovery**: surfacing material the user
has already seen and thought about. An in-app chat panel converses with the
corpus; the same retrieval is optionally exposed as an MCP server.

All data lives on the filesystem as `.md` + YAML frontmatter. No database,
no cloud, no account. Obsidian opens the data root as a valid vault.

## Repository layout

- `web/` — Vite + React 19 + TypeScript frontend (strict mode).
- `src/latestnews/` — Python 3.12 + FastAPI backend (async, uv-managed).
  - `api/` — HTTP routers under `/api/*`.
  - `events/`, `models/`, `ingest/`, `processor/`, `providers/`,
    `search/`, `chat/`, `mcp/`, `fs/`, `preseed/`, `settings/` — subsystems
    populated by later stories.
- `plugins/` — external ingest plugins (interface defined in Story 8.1).
- `tests/` — `backend/`, `plugin_contract/`, `search_quality/`, `web/{e2e,axe}/`.
- `scripts/` — shell helpers mirroring npm scripts (stubs in Story 1.1).
- `!DOCS/` — planning artefacts and implementation artefacts; the sole
  authoritative documentation root.

## How to run the app

Fresh clone:

```bash
npm install
uv sync
npm run dev
```

`npm run dev` launches uvicorn on `127.0.0.1:8000` and Vite on
`127.0.0.1:5173` concurrently. Vite proxies `/api/*` to the backend. Ctrl-C
stops both.

Production-style single-process (to be refined in a later story):

```bash
npm run build
npm run start
```

## How to run tests

```bash
npm run test         # runs web tests + backend pytest
npm run lint         # Biome (JS/TS) + Ruff (Python)
npm run typecheck    # tsc --strict + mypy --strict
```

CI (`.github/workflows/ci.yml`) runs all three on push and pull_request to
`main` and `dev`.

## How to add an ingest plugin

**Stub — to be authored in Story 8.1.** The plugin interface, loader
(asyncio-isolated), contract tests, and the walkthrough example all land
together when Epic 8 begins. Until then, built-in ingest lives inside
`src/latestnews/ingest/`.

## How to add an LLM provider

**Stub — to be authored in Story 3.1.** MVP ships Claude + OpenAI adapters
behind a single `LLMProvider` protocol. Adding a provider post-MVP is a
matter of implementing the protocol and registering the adapter in
`src/latestnews/providers/`.

## Conventional Commits + PR template

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
  Example: `feat(foundation): bootstrap monorepo scaffold (Story 1.1)`.
- Every commit must reference a story ID (NFR-Q6 — story-level commit
  attribution). The story ID belongs in the message subject or body.
- PR template: summarise the change, link the story, list new/removed
  public interfaces, confirm `AGENTS.md` is updated if needed.

See the architecture document's **Implementation Patterns & Consistency
Rules** section for naming conventions (Python `snake_case`, TS `camelCase`,
snake_case on the wire) and anti-patterns (no `console.log`, no `print()`,
no unannotated `any`).

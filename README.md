# LatestNews

A local-first, file-based personal knowledge web application. Paste any link, PDF, image, or text — it becomes searchable markdown enriched by AI summaries, with a hybrid retrieval engine (BM25 + vector + LLM rerank) under the hood. The primary value is **rediscovery**: surfacing what you've already seen and thought about, not finding new information. A natural-language chat panel in the dashboard lets you converse with your own corpus; the same retrieval is optionally available as an MCP server for Claude Desktop, Cursor, and other MCP-capable clients.

## Status

**Pre-implementation — planning complete.** This repository currently contains the full planning artefact set produced via the BMad workflow. Implementation begins next at Epic 1 Story 1.1 (monorepo scaffold).

## Planning artefacts

All authoritative planning documents live under [`!DOCS/planning-artifacts/`](./!DOCS/planning-artifacts/):

- **[PRD](./!DOCS/planning-artifacts/prd.md)** — Product requirements (44 FRs, 38 NFRs, 9 Measurable Outcomes).
- **[Architecture](./!DOCS/planning-artifacts/architecture.md)** — Technical decisions, patterns, project structure (49 core decisions; Vite React + TypeScript frontend, Python + FastAPI backend, QMD search, LLM Provider Protocol, plugin loader).
- **[UX Design Specification](./!DOCS/planning-artifacts/ux-design-specification.md)** — Direction "The Atrium"; design tokens, component strategy, flows, accessibility (1 725 lines).
- **[Epics & Stories](./!DOCS/planning-artifacts/epics.md)** — 9 epics, 40 stories with Given/When/Then acceptance criteria.
- **[Implementation Readiness Report (final)](./!DOCS/planning-artifacts/implementation-readiness-report-2026-04-17-final.md)** — 0 defects, 100 % FR coverage, READY.

The brainstorming session that seeded this work is under [`!DOCS/brainstorming/`](./!DOCS/brainstorming/).

## What this is

- **Local-first.** All data lives on your filesystem as `.md` files with YAML frontmatter. No database, no cloud, no account.
- **Obsidian-compatible.** Point Obsidian at your data root — it opens as a valid vault.
- **Rediscovery-first search.** Hybrid BM25 + vector + LLM rerank via [QMD](https://github.com/tobi/qmd), tuned for conceptual re-encounter of previously seen material.
- **Chat in-app or via MCP.** Dashboard chat panel is primary; QMD's MCP server is launched as an optional side-process for external LLM clients.
- **Pluggable AI providers.** Claude and OpenAI ship in MVP via a single `LLMProvider` protocol; Ollama, Gemini, and others are post-MVP drop-ins.
- **Multi-user without backend.** Shared shelves are just shared filesystem folders (iCloud Drive / Dropbox / Google Drive / git / anything).

## What this isn't

- Not a cloud service. No accounts, no auth, no subscription, no telemetry.
- Not a note-taking app. The product assumes content comes from elsewhere (the web, PDFs, podcasts, videos) and the product's job is to remember it.
- Not a chat app. Chat is an amplifier on top of rediscovery, not the primary surface.

## Tech stack (committed)

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| State | Zustand (client) + TanStack Query (server) |
| Routing | React Router v7 |
| Animation | Motion (formerly framer-motion) |
| Icons | Lucide |
| Typography | Inter + JetBrains Mono (self-hosted) |
| Lint / format | Biome |
| Backend runtime | Python 3.12+ + FastAPI + uvicorn |
| Package manager | uv (Astral) |
| Lint / format / typecheck | Ruff + mypy strict |
| Search | QMD (hybrid BM25 + vector + rerank) |
| MCP | QMD's own MCP server as a side-process |
| Storage | `.md` + YAML frontmatter on filesystem |
| Secrets | OS keychain via Python `keyring` |
| Logging | structlog → `!DOCS/logs/` |
| Tests | Vitest + Playwright (frontend); pytest + hypothesis (backend) |
| CI | GitHub Actions |

## Build & run

Not yet runnable. Implementation starts at Epic 1 Story 1.1 per the epics document.

## Contributing

Once implementation begins, see [`AGENTS.md`](./AGENTS.md) (to be authored in Story 1.1) for how to add ingest plugins, LLM providers, and features. Conventional Commits + story-ID PR template are required per the engineering quality NFRs.

## License

TBD.

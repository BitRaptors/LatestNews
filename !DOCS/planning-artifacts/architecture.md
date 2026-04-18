---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-17'
inputDocuments:
  - '!DOCS/planning-artifacts/prd.md'
  - '!DOCS/brainstorming/brainstorming-session-2026-04-17-1430.md'
  - '!DOCS/planning-artifacts/implementation-readiness-report-2026-04-17.md'
workflowType: 'architecture'
project_name: 'LatestNews'
user_name: 'csacsi'
date: '2026-04-17'
architecturalImperatives:
  - 'Chat must be fully token-streamed into the React UI (SSE or WebSocket; no poll-and-replace). UX-critical; reference FR22.'
  - 'UX quality is first-class, not a final-week polish pass. Every architectural choice must be evaluated against "does this let us hit Linear/Raycast/Arc quality?" Reference NFR-V1, NFR-V2, NFR-V3.'
  - 'React frontend (react-force-graph dependency).'
  - 'Local-first: browser-at-localhost baseline; runtime wrapper (Tauri/Electron) is an open decision.'
  - 'Storage = .md + YAML frontmatter in user-configured folder. No DB lock-in.'
  - 'QMD as hybrid-search + MCP backbone, wrapped behind an adapter.'
  - 'LLM Provider Protocol: Claude + OpenAI MVP, pluggable for Ollama/Gemini/others post-MVP.'
  - 'Sync service opaque to the app — filesystem watcher is the only integration point.'
  - 'Plugin loader with isolation, contract, and test harness.'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (44 FRs across 8 capability areas):**

The product is a local-first personal knowledge application. Architecturally, the FRs decompose into four principal runtime subsystems:

1. **Ingest pipeline** (FR1–FR7) — asynchronous, pluggable, isolated-failure. Must accept URLs and file drops, route to type-specific handlers (HTML, X, YouTube, PDF, image), persist as `.md` with frontmatter, and never lose user input on failure. Plugin architecture (`plugins/*.py`) is designed for MVP but not shipped with third-party plugins.
2. **AI processing pipeline** (FR8–FR13) — runs downstream of ingest, produces TL;DR, related-items, shelf suggestion. Routes all LLM work through a single Provider Protocol (`summarize`, `embed`, `chat_complete`, `rerank`) with Claude and OpenAI adapters for MVP.
3. **Retrieval and chat** (FR14–FR25) — hybrid BM25 + vector + LLM rerank via QMD. Two retrieval surfaces: a dashboard chat panel (primary, token-streamed in React) and an optional MCP server (secondary, same retrieval, external clients). Sensitivity filtering (FR25) is enforced at the retrieval boundary, not in client code.
4. **Organization and multi-user** (FR26–FR36) — Explore graph, shelves as filesystem subfolders, shared shelves via user-configured folder paths, filesystem watcher, conflict-resolution UI. No backend, no auth — filesystem is the collaboration primitive.

Plus two meta-subsystems:

5. **Onboarding** (FR37–FR39) — first-launch pre-seed pipeline from curated sources.
6. **Settings & extensibility** (FR40–FR44) — provider switching, theme, path configuration, `AGENTS.md` operative, self-indexing `!DOCS/`.

**Non-Functional Requirements (38 NFRs across 7 categories):**

NFRs that will drive architectural decisions, in order of architectural impact:

- **NFR-R1 (no silent data loss)** and **NFR-R3 (atomic writes)** — require a write-through pattern: accept the paste, persist a stub immediately, enrich asynchronously. Cannot use "fetch, then process, then save" flow.
- **NFR-S1, NFR-S2 (local-only network surface)** — require a local HTTP server bound to `127.0.0.1`, no 0.0.0.0 binding, no UPnP. The "backend" is a local process, not a deployable service.
- **NFR-R4 (index fully rebuildable)** — filesystem is the source of truth; index is ephemeral derived state.
- **NFR-R5 (plugin failure isolation)** — each plugin runs in isolation; a subprocess model or explicit try-catch boundary with health tracking is required.
- **NFR-P3 (chat first token ≤ 3s)** combined with the token-streaming imperative — requires SSE or WebSocket from backend to frontend, not request-response.
- **NFR-P2 (search ≤ 500 ms p95)** — QMD handles the heavy lifting; the architecture must not add significant overhead. A single in-process call into QMD, not a subprocess-per-query pattern.
- **NFR-I1, NFR-I2 (adapter-isolated integrations)** — LLM providers and MCP both wrapped behind their own adapters.
- **NFR-I3 (sync service opacity)** — filesystem watcher is the only integration point; no cloud SDK dependencies.
- **NFR-V1, NFR-V2, NFR-V3 (visual polish and motion as release gate)** — the frontend is not a skin over the backend. Design-token system, motion library, animation performance at 60 fps are architectural choices, not afterthoughts.
- **NFR-Q1 (regression suite on every commit)** and **NFR-Q3 (plugin contract tested independently)** — the test architecture is a first-class subsystem, not an add-on.

### Scale & Complexity

- **Project complexity:** **medium**, despite the PRD's "low" classification. The low-classification held because the product is local-first with no compliance surface. However, the architecture must absorb genuine complexity in: (a) the ingest pipeline with plugin isolation, (b) the hybrid retrieval stack with streaming chat, (c) the filesystem-as-collab model with conflict handling, and (d) a visual-polish bar equal to well-funded consumer SaaS. Each of these four is independently non-trivial.
- **Primary technical domain:** full-stack web application with a heavy local backend. Frontend = React SPA; backend = a local process exposing HTTP + SSE/WebSocket + (optional) MCP.
- **Corpus scale target:** up to 10 000 items (NFR-R6). Small-to-mid embedding index; no distributed anything.
- **Concurrent user count:** 1 (single-user app per installation). Shared shelves are via filesystem; no server-side concurrency.
- **Estimated architectural components:** approximately 11 — frontend SPA, local HTTP/SSE server, ingest coordinator, ingest plugin host, AI processing worker, LLM Provider adapter layer, QMD integration layer, MCP adapter, filesystem watcher, settings store, design token + motion system.

### Technical Constraints & Dependencies

**Committed in the PRD** (not subject to re-decision in this architecture workflow unless explicitly reopened):

- React as the frontend framework (react-force-graph dependency).
- QMD as the hybrid-search + MCP backbone.
- `.md` + YAML frontmatter as the canonical storage format, Obsidian-vault-compatible.
- LLM Provider Protocol with Claude + OpenAI in MVP.
- Filesystem watcher opaque to sync services.
- Plugin system in Python (`plugins/*.py` per brainstorming decision).

**Open for decision in this workflow:**

- Backend runtime (Python FastAPI / Node / Bun / other) and its relationship to the Python plugins (subprocess, embedded, RPC).
- Bundler and build tooling (Vite assumed unless user overrides).
- Runtime packaging (browser-at-localhost baseline vs. Tauri vs. Electron).
- Transport for backend ↔ frontend (SSE vs. WebSocket; REST for non-streaming calls).
- Index storage location and format (on-disk SQLite? LanceDB? QMD's native store?).
- Design-token implementation (CSS variables + Tailwind? CSS-in-JS? vanilla-extract?).
- Animation library (framer-motion, Motion, GSAP, native Web Animations API).
- State management (Zustand, Jotai, Redux Toolkit, just React hooks + context).
- Test stack (Vitest + Playwright? Vitest + Testing Library? pytest for backend?).
- CI layout.

### Cross-Cutting Concerns

Concerns that span most components and need architectural discipline, not per-component reinvention:

- **Sensitivity propagation.** Every retrieval path (search, chat, MCP) must honor the `sensitivity` frontmatter uniformly. This belongs in a single retrieval middleware, not duplicated across call sites.
- **Error-surfacing and user messaging.** Ingest failures, plugin crashes, LLM provider errors, filesystem conflict artefacts — all surface to the UI through a common non-blocking notification channel. One notification subsystem, not four.
- **Logging and observability.** Local-first means logs live on disk. Plugin errors go to `!DOCS/plugin-errors/` per NFR-R5; general app logs go where? A single logging strategy needs to be decided.
- **Event streaming to the UI.** Ingest progress, chat tokens, filesystem change events all arrive asynchronously from the backend. One SSE/WebSocket channel or three? Unified event envelope or per-feature?
- **Design tokens and motion.** Typography, color, spacing, elevation, animation curves must be expressed once and consumed everywhere. Cross-cutting; architecture responsibility.
- **Test-quality discipline.** Search regression suite (NFR-Q1), plugin contract tests (NFR-Q3), accessibility automation (NFR-A5), performance benchmarks (NFR-P7). All live in the repo's CI. This needs to be architected as a first-class subsystem, not left to per-story improvisation.
- **Self-indexing `!DOCS/`.** The product indexes its own docs. This is a feature, but it implies a boot-time index-check that the docs folder is reachable and has the expected structure — a cross-cutting concern.
- **Runtime configuration vs. build-time.** LLM provider choice, theme, paths, sensitivity default — runtime. QMD presence, plugin discovery directory — boot-time. Bundler config, feature flags — build-time. Architecture needs a single configuration strategy, not three different patterns.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack local application: React SPA frontend + Python async backend. No cloud, no database, no auth. Single user per installation. A monorepo layout (one repository, one mental model, shared `!DOCS/`) is optimal.

### Starter Options Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Vite + React + TS (frontend)** + **hand-rolled FastAPI (backend)** | Official Vite template for frontend; clean minimal FastAPI layout; zero magic | Two scaffold commands; monorepo conventions must be hand-authored | **Selected** |
| Next.js (App Router) full-stack | Single framework | SSR overkill for a local app; Server Components complexity; no native Python ingest | Rejected |
| T3 Stack (`create-t3-app`) | Complete TS stack (Next.js + tRPC + Prisma + Tailwind) | No database needed; no Python path; forced choices | Rejected |
| Tauri + Vite + React | Native wrapper out-of-the-box | Rust ↔ Python IPC adds a third layer; too much for MVP | Post-MVP option, not MVP starter |
| FastAPI Full-Stack Template (official tiangolo) | Well-maintained with TS frontend | PostgreSQL / Docker-oriented; we need neither | Rejected |
| Electron + React starter | Familiar stack | Memory-heavy, dated feel; does not meet the quality bar | Rejected |

### Selected Starter: Custom scaffold — Vite React + TS (frontend) + minimal FastAPI (backend)

**Rationale for selection:**

1. No single off-the-shelf starter fits a React + Python hybrid that is also filesystem-first, no-DB, and plugin-ready.
2. The Vite official React + TS template is an industry default — one `npm create vite@latest` command produces a modern, strict, HMR-enabled, production-ready frontend scaffold.
3. A hand-rolled minimal FastAPI layout is cleaner than any cookiecutter alternative — no DB, auth, migration, or deployment bloat to delete later.
4. A single repository with two subsystems is simpler than introducing Nx or Turborepo for MVP. Developer experience is owned by `AGENTS.md` and the folder layout, not by monorepo tooling.

### Monorepo Layout

```
LatestNews/
├─ AGENTS.md                  # operative documentation (first-class, queryable by wiki)
├─ README.md
├─ package.json               # root: dev-script orchestration (concurrently)
├─ pyproject.toml             # Python project config (uv)
├─ web/                       # React SPA (Vite scaffold)
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.tsx
│     ├─ routes/
│     ├─ features/
│     ├─ design/              # design tokens, theme, motion
│     └─ lib/
├─ src/                       # Python backend
│  └─ latestnews/
│     ├─ __init__.py
│     ├─ app.py               # FastAPI app factory
│     ├─ ingest/              # ingest coordinator + plugin host
│     ├─ processor/           # AI processing pipeline
│     ├─ search/              # QMD integration
│     ├─ chat/                # chat orchestration + SSE streaming
│     ├─ mcp/                 # optional MCP adapter
│     ├─ fs/                  # filesystem watcher, conflict detection
│     ├─ providers/           # LLM provider adapters (Claude, OpenAI)
│     └─ settings/
├─ plugins/                   # drop-in ingest plugins (Python)
│  ├─ url_html.py
│  ├─ pdf.py
│  ├─ image.py
│  ├─ x_post.py
│  └─ youtube.py
├─ tests/
│  ├─ search_quality/         # NFR-Q1 regression suite + gold dataset
│  ├─ plugin_contract/        # NFR-Q3 plugin conformance
│  ├─ backend/                # pytest
│  └─ web/                    # vitest + playwright
├─ !DOCS/
│  ├─ planning-artifacts/     # PRD, architecture, readiness, epics, stories
│  ├─ brainstorming/
│  ├─ CHANGELOG.md            # self-indexed
│  └─ plugin-errors/          # NFR-R5
└─ scripts/
   ├─ dev.sh                  # start backend + frontend concurrently
   ├─ build.sh                # build frontend → static; package backend
   └─ test-ingest.sh          # per-plugin smoke (used in AGENTS.md)
```

### Initialization Commands

```bash
# Frontend scaffold (official Vite React + TypeScript template)
cd /path/to/LatestNews
npm create vite@latest web -- --template react-ts
cd web
npm install

# Backend scaffold (hand-rolled, minimal FastAPI + uv)
# From repo root:
uv init                             # create pyproject.toml, .python-version
uv add fastapi uvicorn watchdog pydantic-settings
uv add --dev pytest pytest-asyncio ruff mypy
```

Concrete versions are deliberately unpinned here — the scaffold command pulls the latest stable at execution time. Lock files produced by the init commands (`package-lock.json`, `uv.lock`) are the authoritative version record, not this document.

### Architectural Decisions Provided by the Scaffold

**Language & Runtime**
- Frontend: TypeScript (strict mode enabled by Vite React-TS template), ES2022+ target, modern JSX runtime.
- Backend: Python 3.12+, async-first with FastAPI.

**Package Management**
- Frontend: npm (Vite default).
- Backend: **uv** (Astral) — fast, modern Python package manager; reproducible lockfile; replaces pip + pip-tools + poetry.

**Build Tooling**
- Frontend: Vite (fast dev server with HMR, Rollup production build, native TS support).
- Backend: uvicorn for dev; production packaging deferred to Step 4 / runtime-packaging decision.

**Testing Framework**
- Frontend: Vitest (Vite-native, Jest-compatible) + Playwright for e2e.
- Backend: pytest + pytest-asyncio.

**Code Organization**
- Feature-first subdirectories in both `web/src/features/` and `src/latestnews/` subsystems.
- Shared concerns live in dedicated top-level folders (`web/src/design/`, `src/latestnews/providers/`).
- Plugins as flat `plugins/*.py` files per the brainstorming's "drop-in `.py`" decision.

**Development Experience**
- Root `package.json` orchestrates `npm run dev` via `concurrently "uv run uvicorn ..." "npm run dev --prefix web"`.
- Hot reload on both sides.
- Single `npm test` runs frontend + backend + regression suites.
- `AGENTS.md` points at `scripts/test-ingest.sh` for new-plugin validation.

### Deferred to Step 4 (Architectural Decisions)

- Styling solution (Tailwind v4 vs. alternatives)
- Component library / design system foundation (shadcn/ui, headless UI, custom)
- Animation library (Motion / framer-motion, GSAP, Web Animations API)
- State management (Zustand, Jotai, React context + hooks)
- Data-fetching layer (TanStack Query, SWR, hand-rolled fetch + SSE hook)
- Runtime packaging for release (browser-at-localhost, Tauri, Electron)
- QMD integration style (Python package import vs. subprocess vs. MCP client)
- Index storage location and format
- Transport details (SSE vs. WebSocket, REST vs. RPC)

### First Implementation Story (for epic authoring)

> Bootstrap the monorepo scaffold: run `npm create vite@latest web -- --template react-ts`, initialize `uv` in the repo root with FastAPI + uvicorn + watchdog + pydantic-settings, create the folder layout shown in this architecture document, commit an empty but passing Vitest + pytest harness and a functional `AGENTS.md` stub. Dev script `npm run dev` must start both servers and reach a "Hello LatestNews" on `http://localhost:5173`.

This story is accepted as Epic 1 Story 1 despite delivering no direct user value, because the architecture's existence is a prerequisite for every subsequent user story. This aligns with the brainstorming's Day 1 ("Foundation") plan.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical decisions (block implementation):** data modelling, storage & index location, plugin isolation model, SSE transport, LLM Provider Protocol surface, sensitivity middleware placement, design token source.

**Important decisions (shape architecture):** state management, data-fetching layer, routing, styling, component library, animation library, logging strategy, CI layout.

**Deferred decisions (post-MVP):** Tauri packaging, PWA support, Telegram bot ingest, auto-discovery crawler scheduler. Electron is explicitly rejected, not deferred.

### Data Architecture

- **Primary storage.** `.md` files with YAML frontmatter on the user's filesystem. No database.
- **Index storage.** Delegated to QMD under `${dataRoot}/.latestnews/index/`. Treated as opaque and fully rebuildable from the markdown corpus per NFR-R4.
- **Data modelling.** Pydantic models define every backend type; Zod schemas define every frontend type; the two are kept in sync via FastAPI's auto-generated OpenAPI consumed by `openapi-typescript` to emit the TS types.
- **Validation.** Pydantic validates every ingest and API boundary; Zod validates every user-form input in React. Fail fast.
- **Frontmatter migration.** Each item carries a `schema_version` frontmatter field. Idempotent migration scripts under `scripts/migrations/` run on boot if the stored version is below current. Plain markdown keeps migrations git-trackable.
- **Caching.** None in MVP beyond what QMD already provides.

### Authentication & Security

- **Authentication.** None. Local-first, single user per installation.
- **Authorization via sensitivity.** Enforced by a single retrieval middleware through which search, chat, and MCP all flow. Items marked `personal` never leak to a context configured as shared or public (NFR-S3).
- **Network binding.** Backend binds only to `127.0.0.1`. No external interface (NFR-S1).
- **CORS.** Allowed origins: `http://localhost:5173` (dev) and the single-origin prod serving path where FastAPI serves the built frontend.
- **LLM provider secrets.** Stored in OS keychain via the Python `keyring` package (macOS Keychain, Windows Credential Manager, Linux libsecret). Fallback to `.env` in the data root only when keychain is unavailable. Never committed; excluded from the ingested corpus (NFR-S6).
- **Data-at-rest encryption.** Delegated to the OS (FileVault / BitLocker / LUKS). No double-encryption.

### API & Communication Patterns

- **API style.** REST for commands; a single multiplexed SSE channel at `/api/events` for server→client streaming.
- **SSE envelope.** `{ type, payload, meta }` with `type` a discriminated union: `chat.token`, `chat.citation`, `chat.done`, `ingest.progress`, `ingest.error`, `fs.change`, `fs.conflict`. One subscription on the frontend, typed union on both sides.
- **WebSockets.** Not used. Unidirectional streaming is sufficient; SSE is simpler over plain HTTP.
- **API documentation.** FastAPI's auto-generated OpenAPI at `/docs` (Swagger UI) and `/redoc`. No extra docs tooling.
- **Error envelope.** `{ error: { code, message, hint?, details? } }` paired with HTTP status. The `code` is a stable string for future i18n.
- **Plugin isolation.** Asyncio tasks with `asyncio.wait_for` timeouts and try/except boundaries. Failures are logged to `!DOCS/plugin-errors/` and the offending item is quarantined (NFR-R5). A subprocess-based isolation upgrade is documented as a future option if asyncio-based isolation proves insufficient.
- **QMD integration.** In-process Python package import, wrapped behind `src/latestnews/search/qmd_adapter.py`. Meets NFR-P2 (≤ 500 ms search p95). The adapter isolates against QMD API changes (NFR-I1 style).
- **Optional MCP surface.** QMD's own MCP server is launched as a side-process with the user's configured data root. The product does not reimplement MCP — it ships QMD's MCP server under its own configuration.

### Frontend Architecture

- **State management.** Zustand (client-local state).
- **Server-state / data-fetching.** TanStack Query for REST; native `EventSource` wrapped in a `useSSE` hook for the unified event channel.
- **Routing.** React Router v7 with data APIs and loaders. Sufficient for the MVP's ~3 routes (`/dashboard`, `/explore`, `/settings`).
- **Styling.** Tailwind CSS v4 with semantic tokens declared in the `@theme` layer. Maps directly to the PRD's tokenized design-system requirement (NFR-V1).
- **Component library.** shadcn/ui — copy-paste components built on Radix UI primitives. Radix handles accessibility heavy lifting (NFR-A1–NFR-A5) while leaving design customization unconstrained.
- **Icon library.** Lucide. Single family, tree-shakeable.
- **Animation.** Motion (formerly framer-motion). Declarative variants, layout animations, `prefers-reduced-motion` native support, 60 fps on modern engine (NFR-V2).
- **Forms.** React Hook Form with Zod resolver.
- **Graph rendering.** `react-force-graph` in WebGL mode (required by PRD; meets NFR-P6 fps targets).
- **Virtualization.** TanStack Virtual for any list that can exceed ~200 rows (corpus at NFR-R6 scale).
- **Design token source.** CSS custom properties in `web/src/design/tokens.css`, consumed by both the Tailwind config and components. Single source; dark/light parity required.
- **Theme persistence.** `localStorage` with `prefers-color-scheme` as the initial fallback.
- **Lint & format.** Biome for JS/TS (replaces ESLint + Prettier). Single config; single cache.
- **Type checking.** `tsc --noEmit --strict` on the frontend.

### Backend Architecture

- **Runtime.** Python 3.12+, async-first with FastAPI.
- **Package manager.** uv (Astral) — fast, reproducible lockfile, replaces pip + poetry.
- **Configuration.** `pydantic-settings` reading from environment + `.env`; typed access everywhere.
- **Logging.** structlog emitting structured JSON to `!DOCS/logs/app.log` (daily rotation). Plugin errors additionally logged to `!DOCS/plugin-errors/` per NFR-R5. Frontend errors shipped to backend via `/api/log` and merged into the same stream. The entire log directory is queryable via the product's own search (self-indexing extension).
- **Lint & format.** Ruff (lint + format, replaces flake8 + black + isort).
- **Type checking.** mypy in strict mode.
- **Test stack.** pytest + pytest-asyncio; hypothesis for property-based tests on the frontmatter parser and ingest pipeline.
- **Search regression suite.** Custom pytest harness under `tests/search_quality/` with YAML-defined gold dataset + fixed queries (NFR-Q1). First-class subsystem.

### Infrastructure & Deployment

- **Hosting.** None — local-first.
- **MVP release packaging.** Browser-at-localhost. `npm run start` launches backend, which also serves the built frontend as static files. One command, one URL.
- **Phase 2 release packaging.** Tauri wrapper. Lightweight, native look-and-feel, matches the quality benchmark (NFR-V3).
- **Electron.** Explicitly rejected. Fails the quality bar; bloated.
- **Dev orchestration.** Root `package.json` with `concurrently` running `uv run uvicorn ...` and `npm run dev --prefix web`. Exposed as `npm run dev`. Both sides HMR-enabled.
- **CI.** GitHub Actions. Matrix: lint (Biome + Ruff), type-check (tsc + mypy), frontend unit/component tests (Vitest), backend tests (pytest), search-quality regression, accessibility lint (axe-core via Playwright), production build. All required for merge to main.
- **Git workflow.** Conventional Commits. PR template requires: story ID, `AGENTS.md` check (NFR-Q4), `!DOCS/CHANGELOG.md` update. Every commit attributable to a story or maintenance ticket (NFR-Q6).
- **Versioning.** SemVer with date-based pre-release tags (`0.1.0-2026.04.17`) for the MVP phase.
- **Observability.** Local-only. No telemetry in MVP (NFR-S5).

### Decision Impact Analysis

**Implementation sequence (which decisions unblock which stories):**

1. Starter scaffold (Epic 1 Story 1) — unblocks everything.
2. LLM Provider Protocol + Claude adapter — unblocks AI processing pipeline and chat.
3. QMD adapter + search endpoint — unblocks search feature.
4. SSE event bus + chat endpoint — unblocks chat UI.
5. Design tokens + motion primitives — unblocks any feature UI that must meet NFR-V1/V2.
6. Filesystem watcher — unblocks shared shelves and live refresh.
7. Plugin loader — unblocks plugin-based ingest types.
8. Pre-seed pipeline — unblocks onboarding.

**Cross-component dependencies:**

- Every backend endpoint → SSE event envelope typing → frontend `useSSE` hook expectation.
- LLM Provider Protocol → AI processing worker + chat streaming + pre-seed pipeline.
- Sensitivity middleware → search + chat + MCP (single implementation, three consumers).
- Design tokens → every visual component, including error states, toasts, empty states.
- `AGENTS.md` → every new ingest plugin and every feature PR (NFR-Q4 gate).

## Implementation Patterns & Consistency Rules

### Why This Section Exists

When multiple AI agents (or humans) contribute code to this repository, they can independently reach different-but-valid answers on the same question. Different answers produce an inconsistent codebase that fights its tools. This section defines the answers once so every contributor converges on them. Biome and Ruff enforce most of these mechanically; the rest are documented rules enforced in review.

### Naming Conventions

**Python (backend, plugins):**
- Files: `snake_case.py` (enforced by Ruff config).
- Modules: `snake_case`.
- Classes: `PascalCase` (models, adapters, exceptions).
- Functions / variables / parameters: `snake_case`.
- Constants: `UPPER_SNAKE_CASE` at module level.
- Test files: `test_*.py` (pytest default).
- Type aliases: `PascalCase`.
- Async functions: no `_async` suffix — async is encoded by the `await` call site, not the name.

**TypeScript / React (frontend):**
- Component files: `PascalCase.tsx` (e.g. `ChatPanel.tsx`).
- Hook files: `camelCase.ts` starting with `use` (e.g. `useSSE.ts`).
- Utility / library files: `kebab-case.ts` (e.g. `format-citation.ts`).
- Route files: `kebab-case.tsx` matching the URL segment (e.g. `dashboard.tsx`, `explore.tsx`).
- Components (JSX): `PascalCase`.
- Hooks: `camelCase`, must start with `use`.
- Functions / variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for true compile-time constants; `camelCase` for derived values.
- Types / interfaces: `PascalCase`, no `I` prefix.
- CSS custom properties: `--kebab-case` with semantic prefix (e.g. `--color-surface-primary`, `--space-4`).
- Tailwind semantic classes: derived from tokens via `@theme` — no raw hex/spacing values in JSX.

**API wire format:**
- **Snake_case on the wire.** FastAPI serializes Pydantic models to `snake_case` JSON by default; we keep this. TypeScript types generated from OpenAPI mirror the wire format exactly. No camelCase/snake_case translation in application code.
- Wire example: `{ item_id, created_at, shelf_path, sensitivity_level }`, not `{ itemId, createdAt, ... }`.
- This single rule eliminates one of the most common AI-agent divergence points.

**SSE event type names:**
- Dotted lower-case: `chat.token`, `chat.citation`, `chat.done`, `ingest.progress`, `ingest.error`, `fs.change`, `fs.conflict`.
- Namespace = feature area; after the dot = specific event.
- New event types require a PR that updates both the Python `EventType` enum and the TypeScript discriminated union.

**Zustand store naming:**
- One file per store: `use<Feature>Store.ts` (e.g. `useChatStore.ts`, `useSettingsStore.ts`).
- Actions named as verbs in present imperative: `setTheme`, `appendMessage`, `clearInbox`. No `handle*` prefix.

**Filesystem item IDs:**
- Item filename = `<timestamp>-<slug>.md` where timestamp is ISO-like `20260417T094700Z` and slug is the first 40 chars of the title slugified.
- Internal ID (used in index and API) = UUID v7 stored in the frontmatter `id` field. Filename is for humans; UUID is for the system.
- Never rename a file to change its ID; the UUID is stable across renames.

### Project Structure

**Test location:**
- Backend tests: separate tree under `tests/` (`tests/backend/`, `tests/plugin_contract/`, `tests/search_quality/`).
- Frontend tests: co-located with source as `*.test.ts` / `*.test.tsx` next to the file under test.
- Frontend e2e tests: under `tests/web/e2e/` (Playwright).
- Reason: backend convention follows Python community norms; frontend convention follows Vitest + Vite norms.

**Feature organization:**
- **Frontend** organized by **feature**, not by type. `web/src/features/chat/`, `web/src/features/capture/`, `web/src/features/explore/`. Each feature folder contains its own components, hooks, store, types, tests.
- **Backend** organized by **subsystem**, not by feature. `src/latestnews/ingest/`, `src/latestnews/search/`, `src/latestnews/chat/`. Reflects pipeline structure.

**Shared / cross-cutting placement:**
- Frontend: `web/src/design/` (tokens, theme, motion), `web/src/lib/` (pure utilities), `web/src/components/` (generic UI — buttons, dialogs — from shadcn/ui).
- Backend: `src/latestnews/settings/`, `src/latestnews/providers/`, `src/latestnews/fs/`, `src/latestnews/mcp/`.

**Static assets:**
- App icons, hero animation assets: `web/src/assets/`.
- Pre-seed curated content: `src/latestnews/preseed/content/`.

**Config files:**
- `biome.json` at repo root (frontend lint/format).
- `pyproject.toml` at repo root (Python project + Ruff + mypy config).
- `tsconfig.json` at `web/`; extended by `tsconfig.node.json`.
- `.env.example` at repo root; never commit real `.env`.

### API Response & Error Formats

**Success response:**
- Direct payload, no wrapper. `GET /api/items` returns `Item[]`; `GET /api/items/{id}` returns `Item`.
- HTTP status 200 for reads, 201 for creates with Location header, 204 for deletes.

**Error response:**
- Wrapped: `{ "error": { "code": string, "message": string, "hint"?: string, "details"?: object } }`.
- `code` is a machine-stable string (e.g. `ingest.plugin_timeout`, `retrieval.sensitivity_denied`). Dotted, same namespace style as SSE events.
- `message` is developer-facing; `hint` is user-facing (shown in UI toasts).
- HTTP status matches semantic meaning (400 / 404 / 409 / 500 etc.).

**Date / time:**
- Always ISO 8601 with timezone: `"2026-04-17T09:47:00.000Z"`.
- Backend: `datetime` with UTC; never naive datetimes.
- Frontend: store as ISO string; parse with `new Date()` only at render boundary.

**Booleans:**
- Literal `true` / `false` on the wire. Never `0` / `1`, never `"yes"` / `"no"`.

**Null vs missing:**
- `null` for intentional absence of value. Field omission for optional fields that have not been set. Pydantic models treat both consistently; frontend TypeScript types reflect the Python model.

### State Management Patterns

**Zustand stores:**
- Immutable updates only (Zustand middleware guards this).
- Selectors in the component: `const theme = useSettingsStore(s => s.theme)`. No full-state `useStore()` calls in render.
- Side-effects never live inside store updaters; they live in action functions that then call `set(...)`.

**Server state stays in TanStack Query:**
- Never copy server data into Zustand. Zustand is for client-local UI state (panel open/closed, draft input, theme preference, etc.).

**SSE events:**
- Received by the root-level `useSSE` hook.
- Dispatched to the relevant feature's Zustand store via typed handlers.
- Never consumed directly by components.

### Error Handling

**Backend:**
- Custom exception hierarchy rooted at `LatestNewsError(Exception)` with subclasses `IngestError`, `RetrievalError`, `ProviderError`, etc.
- FastAPI exception handlers translate exceptions → error envelope + appropriate status.
- Internal errors (5xx) are logged at ERROR level with full traceback; 4xx errors logged at INFO level without traceback.

**Frontend:**
- Route-level `ErrorBoundary` catches rendering errors.
- TanStack Query `onError` callbacks surface via the toast system.
- SSE stream errors auto-reconnect with exponential backoff (capped at 30 s).
- Global error handler (`window.onerror`, `unhandledrejection`) ships to `/api/log` for observability.

**User-facing messages:**
- Always drawn from the `error.hint` field when available.
- Fallback message: "Something went wrong — please retry. If it persists, check the logs." Never show raw exception text to users.

### Loading States

- Route-level loading: React Router v7 data loaders + React Suspense.
- In-component async: TanStack Query `isPending` / `isFetching`. No manual loading state in components for server data.
- Optimistic updates where low-risk (thumbs-up/down, item deletion): TanStack Query `onMutate` rollback pattern.
- Skeleton components live in `web/src/components/skeleton/` and are reused; no bespoke per-feature skeletons.

### Logging

**Backend:**
- All logs go through `structlog`. Every log entry includes at minimum: `timestamp`, `level`, `event`, `module`, `correlation_id`.
- Correlation ID is a UUID set at request entry and propagated through the async context.
- Plugin errors additionally include `plugin_name`, `item_id`, and are written to a dedicated `!DOCS/plugin-errors/<date>.log` stream in addition to the main log.

**Frontend:**
- No `console.log` in shipped code (Biome rule).
- `debug(event, data)` / `info(...)` / `warn(...)` / `error(...)` helpers in `web/src/lib/log.ts` that POST to `/api/log`.
- Errors captured at the error boundary include component stack.

### Commit & PR Patterns

**Commits (Conventional Commits):**
- `feat(capture): accept paste of multiple URLs in one submit`
- `fix(chat): stop streaming hanging when provider times out`
- `docs(agents): add Spotify plugin walkthrough`
- `test(search): expand gold dataset to 10 items`
- Types allowed: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `style`.
- Scope is the subsystem name (`capture`, `chat`, `search`, `explore`, `settings`, `ingest`, `providers`, `fs`, `mcp`, `agents`, `docs`, `ci`).

**PRs:**
- Title = commit-style summary.
- Body required sections:
  - **Story:** link or ID from `!DOCS/planning-artifacts/stories.md` (NFR-Q6).
  - **What changed:** 2–5 bullet points.
  - **AGENTS.md check:** "no" or "yes — updated `AGENTS.md` section ..." (NFR-Q4 gate).
  - **CHANGELOG:** "no" for internal changes, or `## unreleased` entry appended.
  - **Screenshots / recordings:** required when UI visibly changes.
- CI must pass all jobs (lint, typecheck, tests, regression suite, a11y lint, build) before merge.

### Enforcement

**Mechanically enforced:**
- Biome (JS/TS lint, format, import sort, no-console) — pre-commit and CI.
- Ruff (Python lint, format) — pre-commit and CI.
- mypy strict and `tsc --strict` — CI.
- Accessibility: axe-core via Playwright — CI.
- Search regression suite — CI.

**Review-enforced:**
- Feature vs. subsystem folder placement.
- SSE event type consistency with the union.
- Error envelope `code` string quality.
- `AGENTS.md` updates.
- PR body completeness.

### Anti-Patterns (Rejected on Review)

- **Silent fallbacks** in place of proper error surfaces ("if ingest fails, just skip it" — violates NFR-R1).
- **Server data in Zustand** — server state belongs in TanStack Query; Zustand duplicates invite staleness.
- **Raw hex colors or arbitrary spacing values** in components — violates NFR-V1 (all visuals through tokens).
- **Polling** in place of SSE — violates the streaming imperative.
- **`console.log` / `print()` in shipped code** — use the logging helpers.
- **Catch-all `except Exception`** without re-raise or explicit handling — backend; must handle specific exceptions.
- **`any` type in TypeScript** without an adjacent comment explaining why — Biome warns.
- **Two-way API format translations** (snake_case ↔ camelCase) in app code — keep wire format consistent through the stack.
- **"Various fixes"** commit messages (NFR-Q6).

## Project Structure & Boundaries

### Complete Project Directory Structure

```
LatestNews/
├─ README.md
├─ AGENTS.md                           # Authoritative agent/dev guide (FR43)
├─ LICENSE
├─ .gitignore
├─ .editorconfig
├─ biome.json                          # Biome config (lint + format JS/TS)
├─ package.json                        # Root: dev orchestration scripts only
├─ package-lock.json
├─ pyproject.toml                      # Python project + Ruff + mypy config
├─ uv.lock
├─ .python-version                     # uv pin (3.12+)
├─ .env.example
├─ .github/
│  └─ workflows/
│     ├─ ci.yml                        # lint, typecheck, tests, build
│     ├─ search-regression.yml         # NFR-Q1 gold-dataset check
│     └─ a11y.yml                      # axe-core Playwright check
├─ scripts/
│  ├─ dev.sh                           # backend+frontend via concurrently
│  ├─ start.sh                         # production one-command launch
│  ├─ build.sh                         # build frontend → static, stage backend
│  ├─ test-ingest.sh                   # per-plugin smoke test (AGENTS.md step)
│  └─ migrations/
│     └─ .keep                         # future schema_version migrations
│
├─ web/                                # === FRONTEND (React SPA) ===
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ public/
│  │  └─ favicon.svg
│  └─ src/
│     ├─ main.tsx                      # React Router bootstrap
│     ├─ router.tsx                    # route table
│     ├─ app-shell/
│     │  ├─ AppShell.tsx               # outer chrome: nav, theme, toasts
│     │  ├─ Toasts.tsx
│     │  └─ ErrorBoundary.tsx
│     ├─ routes/
│     │  ├─ dashboard.tsx              # /
│     │  ├─ explore.tsx                # /explore
│     │  └─ settings.tsx               # /settings
│     ├─ features/
│     │  ├─ capture/                   # FR1–FR6 (frontend side)
│     │  │  ├─ CaptureInput.tsx
│     │  │  ├─ DropZone.tsx
│     │  │  ├─ IngestStatusList.tsx
│     │  │  ├─ useCaptureStore.ts
│     │  │  ├─ api.ts                  # POST /api/items
│     │  │  └─ CaptureInput.test.tsx
│     │  ├─ items/                     # FR16, FR19, FR32
│     │  │  ├─ ItemList.tsx
│     │  │  ├─ ItemRow.tsx
│     │  │  ├─ ItemDetailPanel.tsx
│     │  │  ├─ useItemsQuery.ts
│     │  │  └─ mutations.ts
│     │  ├─ search/                    # FR14–FR18
│     │  │  ├─ SearchBar.tsx
│     │  │  ├─ SearchResults.tsx
│     │  │  ├─ ShelfFilter.tsx
│     │  │  ├─ ThumbsFeedback.tsx
│     │  │  └─ useSearchQuery.ts
│     │  ├─ chat/                      # FR20–FR25 (frontend)
│     │  │  ├─ ChatPanel.tsx
│     │  │  ├─ ChatMessage.tsx
│     │  │  ├─ Citation.tsx
│     │  │  ├─ PromptTemplates.tsx     # FR23
│     │  │  ├─ useChatStore.ts
│     │  │  └─ useChatStream.ts        # consumes SSE chat.* events
│     │  ├─ explore/                   # FR26–FR29
│     │  │  ├─ ExplorePage.tsx
│     │  │  ├─ ForceGraph.tsx          # react-force-graph wrapper
│     │  │  ├─ NodeDetail.tsx
│     │  │  └─ useGraphData.ts
│     │  ├─ shelves/                   # FR31, FR34, FR35
│     │  │  ├─ ShelfList.tsx
│     │  │  ├─ ShelfPathConfig.tsx
│     │  │  └─ ConflictResolution.tsx
│     │  ├─ sensitivity/               # FR33
│     │  │  ├─ SensitivityBadge.tsx
│     │  │  └─ SensitivityPicker.tsx
│     │  ├─ onboarding/                # FR37–FR39
│     │  │  ├─ FirstLaunchHero.tsx
│     │  │  ├─ PreSeedBanner.tsx
│     │  │  └─ onboarding-flow.ts
│     │  └─ settings/                  # FR40–FR42
│     │     ├─ SettingsForm.tsx
│     │     ├─ DataRootSection.tsx
│     │     ├─ LlmProviderSection.tsx
│     │     ├─ ThemeSection.tsx
│     │     └─ SharedShelvesSection.tsx
│     ├─ design/                       # NFR-V1, NFR-V2
│     │  ├─ tokens.css                 # CSS custom properties, single source
│     │  ├─ theme.ts                   # Tailwind + token integration
│     │  ├─ motion.ts                  # Motion variants / durations / easings
│     │  └─ typography.ts
│     ├─ components/                   # generic UI (shadcn/ui-derived)
│     │  ├─ ui/
│     │  │  ├─ Button.tsx
│     │  │  ├─ Dialog.tsx
│     │  │  ├─ Input.tsx
│     │  │  ├─ Toast.tsx
│     │  │  ├─ Tabs.tsx
│     │  │  └─ …
│     │  └─ skeleton/
│     │     ├─ ItemRowSkeleton.tsx
│     │     └─ GraphSkeleton.tsx
│     ├─ lib/
│     │  ├─ api-client.ts              # fetch wrapper, error envelope handling
│     │  ├─ sse.ts                     # useSSE + reconnect logic
│     │  ├─ log.ts                     # frontend logging → /api/log
│     │  ├─ format-citation.ts
│     │  └─ type-guards.ts
│     ├─ types/
│     │  └─ api.generated.ts           # openapi-typescript output
│     └─ assets/
│        ├─ logo.svg
│        └─ onboarding-hero.lottie     # restrained hero animation
│
├─ src/                                # === BACKEND (Python / FastAPI) ===
│  └─ latestnews/
│     ├─ __init__.py
│     ├─ __main__.py                   # `python -m latestnews` entry
│     ├─ app.py                        # FastAPI app factory, middleware wiring
│     ├─ config.py                     # pydantic-settings
│     ├─ errors.py                     # LatestNewsError hierarchy + handlers
│     ├─ logging_.py                   # structlog setup
│     ├─ events/                       # SSE event bus
│     │  ├─ __init__.py
│     │  ├─ bus.py                     # async pub/sub
│     │  ├─ types.py                   # EventType enum + payload models
│     │  └─ endpoint.py                # /api/events SSE endpoint
│     ├─ api/
│     │  ├─ __init__.py
│     │  ├─ items.py                   # POST/GET/DELETE /api/items
│     │  ├─ search.py                  # GET /api/search
│     │  ├─ chat.py                    # POST /api/chat (streams via SSE)
│     │  ├─ shelves.py                 # /api/shelves
│     │  ├─ settings.py                # /api/settings
│     │  ├─ log.py                     # POST /api/log (frontend ingest)
│     │  └─ health.py                  # /api/health
│     ├─ models/                       # Pydantic domain models
│     │  ├─ __init__.py
│     │  ├─ item.py                    # Item, Frontmatter, Sensitivity
│     │  ├─ shelf.py
│     │  ├─ chat.py
│     │  └─ settings.py
│     ├─ ingest/                       # FR1–FR7
│     │  ├─ __init__.py
│     │  ├─ coordinator.py             # accept paste → stub → enqueue enrichment
│     │  ├─ queue.py                   # asyncio queue + worker
│     │  ├─ plugin_host.py             # discover + invoke + isolate plugins
│     │  ├─ plugin_api.py              # safe re-export surface for plugins
│     │  └─ retry.py
│     ├─ processor/                    # FR8–FR11
│     │  ├─ __init__.py
│     │  ├─ pipeline.py                # TL;DR → related → shelf suggestion
│     │  ├─ summarize.py
│     │  ├─ relate.py
│     │  └─ shelf_suggest.py
│     ├─ providers/                    # FR12, FR13, NFR-I1
│     │  ├─ __init__.py
│     │  ├─ protocol.py                # LLM Provider Protocol ABC
│     │  ├─ claude.py
│     │  ├─ openai.py
│     │  ├─ registry.py                # discover + register adapters
│     │  └─ selector.py                # runtime provider switching
│     ├─ search/                       # FR14–FR19
│     │  ├─ __init__.py
│     │  ├─ qmd_adapter.py             # QMD integration
│     │  ├─ ranker.py                  # rerank boost from ratings
│     │  └─ sensitivity_middleware.py  # FR25, NFR-S3 — SINGLE implementation
│     ├─ chat/                         # FR20–FR25
│     │  ├─ __init__.py
│     │  ├─ orchestrator.py            # retrieval + synthesis + stream
│     │  ├─ prompt_templates.py        # FR23
│     │  └─ citations.py
│     ├─ mcp/                          # FR24
│     │  ├─ __init__.py
│     │  ├─ qmd_launcher.py            # manages QMD MCP side-process
│     │  └─ lifecycle.py
│     ├─ fs/                           # FR34–FR36, NFR-I3
│     │  ├─ __init__.py
│     │  ├─ watcher.py                 # watchdog-based filesystem watcher
│     │  ├─ writer.py                  # atomic write, temp-file-rename
│     │  ├─ parser.py                  # markdown + frontmatter parse/serialize
│     │  └─ conflict_detector.py       # *(conflicted copy)* detection
│     ├─ preseed/                      # FR37–FR39
│     │  ├─ __init__.py
│     │  ├─ pipeline.py
│     │  └─ content/                   # curated starter items (bundled)
│     │     ├─ hn-welcome.md
│     │     ├─ telex-sample.md
│     │     └─ …
│     └─ settings/                     # FR40–FR42
│        ├─ __init__.py
│        ├─ store.py                   # settings persistence (JSON in data root)
│        ├─ secrets.py                 # OS keychain via keyring
│        └─ paths.py                   # data root + shared shelf path validation
│
├─ plugins/                            # === INGEST PLUGINS (drop-in Python) ===
│  ├─ README.md                        # points at AGENTS.md plugin section
│  ├─ url_html.py
│  ├─ pdf.py
│  ├─ image.py
│  ├─ x_post.py
│  └─ youtube.py
│
├─ tests/                              # === TESTS ===
│  ├─ backend/                         # pytest unit/integration
│  │  ├─ ingest/
│  │  ├─ search/
│  │  ├─ chat/
│  │  ├─ fs/
│  │  └─ providers/
│  ├─ plugin_contract/                 # NFR-Q3 plugin conformance
│  │  ├─ conftest.py
│  │  ├─ test_contract.py
│  │  └─ fixtures/
│  │     ├─ url_html/
│  │     ├─ pdf/
│  │     └─ …
│  ├─ search_quality/                  # NFR-Q1 regression suite
│  │  ├─ gold_dataset/
│  │  │  ├─ items/                     # 10 seed .md files
│  │  │  └─ queries.yaml               # 5 test queries + expected top-N
│  │  ├─ test_regression.py
│  │  └─ report_formatter.py
│  └─ web/                             # Playwright e2e
│     ├─ e2e/
│     │  ├─ onboarding.spec.ts
│     │  ├─ capture.spec.ts
│     │  ├─ search.spec.ts
│     │  └─ chat.spec.ts
│     └─ axe/
│        └─ accessibility.spec.ts
│
└─ !DOCS/                              # === SELF-INDEXED DOCUMENTATION ===
   ├─ planning-artifacts/
   │  ├─ prd.md
   │  ├─ architecture.md
   │  ├─ implementation-readiness-report-*.md
   │  ├─ stories.md                    # referenced by NFR-Q6
   │  └─ epics.md
   ├─ brainstorming/
   │  └─ brainstorming-session-2026-04-17-1430.md
   ├─ CHANGELOG.md                     # updated by PR template (NFR-Q4)
   ├─ logs/                            # structlog output (gitignored)
   └─ plugin-errors/                   # NFR-R5 (gitignored)
```

### Architectural Boundaries

**API boundaries (HTTP surface of the backend):**

| Path | Method | Purpose | FR |
|------|--------|---------|----|
| `/api/items` | POST | Accept URL/file for ingest | FR1, FR2 |
| `/api/items` | GET | List items with filters | FR14, FR18 |
| `/api/items/{id}` | GET | Item detail | FR19 |
| `/api/items/{id}` | PATCH | Edit frontmatter (move shelf, sensitivity, rating, AI overrides) | FR11, FR17, FR32, FR33 |
| `/api/items/{id}` | DELETE | Delete item | FR32 |
| `/api/search` | GET | Hybrid search with rerank | FR14–FR17 |
| `/api/chat` | POST | Start chat turn; response streams via SSE | FR20 |
| `/api/shelves` | GET | List shelves | FR31 |
| `/api/shelves/paths` | GET/PATCH | Configure shared shelf paths | FR34, FR40 |
| `/api/shelves/conflicts` | GET | List filesystem conflict artefacts | FR35 |
| `/api/shelves/conflicts/{id}/resolve` | POST | Pick one version | FR35 |
| `/api/settings` | GET/PATCH | Settings read/write | FR40–FR42 |
| `/api/settings/providers` | GET/PATCH | LLM provider switching | FR13 |
| `/api/events` | GET (SSE) | Unified server→client event stream | all streaming FRs |
| `/api/log` | POST | Frontend log ingest | internal |
| `/api/health` | GET | Liveness check | internal |

**Component boundaries (frontend):**

- **Route components** own data loading via React Router loaders; pass resolved data to feature components as props.
- **Feature components** encapsulate one FR-area; own their Zustand store file; only communicate outward via a feature-exposed hook or event.
- **Generic UI components** (`components/ui/`) have no feature knowledge, no data fetching, no state coupling.
- **Design components** (tokens, motion) have no React logic — pure CSS/JS exports.
- **Cross-feature communication** only via the root SSE event bus dispatched through `useSSE`.

**Service boundaries (backend):**

- **`api/`** layer translates HTTP ↔ internal calls. No business logic; only routing, validation, error translation.
- **Subsystem modules** (`ingest/`, `processor/`, `search/`, `chat/`, `fs/`, `mcp/`, `preseed/`, `settings/`, `providers/`) own their business logic. They depend on `models/`, `events/`, `errors/`, and each other only through explicit imports from public `__init__.py` surfaces.
- **`events/bus.py`** is the only inter-subsystem async event channel. No subsystem calls another's internals directly; they publish events.
- **`providers/protocol.py`** is the only contact point between the app and any LLM; every subsystem goes through it.
- **Plugins** (`plugins/*.py`) are discovered by `ingest/plugin_host.py` at boot; they only implement the documented `matches(url) -> bool` and `ingest(url) -> IngestResult` contract. They do not import from `latestnews` internals beyond the narrow `plugin_api` module (which re-exports only the safe types).

**Data boundaries:**

- **Source of truth:** filesystem under `${dataRoot}/`. Items, shelves, frontmatter all live here.
- **Derived state:** QMD index under `${dataRoot}/.latestnews/index/`. Fully rebuildable (NFR-R4).
- **Settings:** JSON file at `${dataRoot}/.latestnews/settings.json`.
- **Secrets:** OS keychain; never on disk in plain text.
- **Logs:** `!DOCS/logs/` and `!DOCS/plugin-errors/` relative to repo root (development); `${dataRoot}/.latestnews/logs/` in release packaging.
- **No module outside `fs/`** reads or writes markdown files directly. All markdown I/O goes through `fs.writer`, `fs.parser`, `fs.watcher`.

### Requirements-to-Structure Mapping

| Capability area | Primary frontend location | Primary backend location | Related plugins |
|-----------------|--------------------------|--------------------------|-----------------|
| Capture & Ingest (FR1–FR7) | `web/src/features/capture/` | `src/latestnews/ingest/` | `plugins/*.py` |
| AI Content Processing (FR8–FR13) | `web/src/features/items/` (override UI), `web/src/features/settings/` (provider switch) | `src/latestnews/processor/`, `src/latestnews/providers/` | — |
| Search & Retrieval (FR14–FR19) | `web/src/features/search/`, `web/src/features/items/` | `src/latestnews/search/` | — |
| Chat & Conversation (FR20–FR25) | `web/src/features/chat/` | `src/latestnews/chat/`, `src/latestnews/mcp/` | — |
| Exploration & Visualization (FR26–FR30) | `web/src/features/explore/` | `src/latestnews/search/` (graph query) | — |
| Shelves / Sensitivity / Multi-User (FR31–FR36) | `web/src/features/shelves/`, `web/src/features/sensitivity/` | `src/latestnews/fs/`, `src/latestnews/search/sensitivity_middleware.py` | — |
| Onboarding (FR37–FR39) | `web/src/features/onboarding/` | `src/latestnews/preseed/` | — |
| Settings & Extensibility (FR40–FR44) | `web/src/features/settings/` | `src/latestnews/settings/`, `AGENTS.md` (root), `!DOCS/` | — |

**Cross-cutting concerns (from Step 2):**

| Concern | Location |
|---------|----------|
| Sensitivity propagation | `src/latestnews/search/sensitivity_middleware.py` — single implementation; search / chat / MCP all pass through |
| Error surfacing & notifications | Backend: `src/latestnews/errors.py`; SSE envelope for async; frontend `app-shell/Toasts.tsx` |
| Logging | `src/latestnews/logging_.py`, `web/src/lib/log.ts`, `/api/log` endpoint |
| Event streaming | `src/latestnews/events/` + `web/src/lib/sse.ts` |
| Design tokens & motion | `web/src/design/` |
| Test quality | `tests/search_quality/`, `tests/plugin_contract/`, `.github/workflows/*.yml` |
| Self-indexing `!DOCS/` | Indexed at boot via `src/latestnews/search/qmd_adapter.py` scanning `!DOCS/` + data root together |
| Runtime vs. build-time config | Runtime: `src/latestnews/config.py` + `/api/settings`; build-time: `vite.config.ts`, `pyproject.toml` |

### Integration Points

**Internal communication:**

- **Frontend → Backend (commands):** HTTP REST via `web/src/lib/api-client.ts`; JSON wire format; snake_case.
- **Backend → Frontend (async events):** single SSE stream `/api/events`; typed discriminated union.
- **Frontend → Frontend:** via Zustand stores (client state) and TanStack Query cache (server state). SSE events dispatched by `useSSE` into the relevant store.
- **Backend → Backend (inter-subsystem):** direct async function calls when synchronous; `events/bus.py` pub-sub when loose coupling preferred. Never HTTP-to-self.
- **Backend → QMD:** in-process Python package import through `search/qmd_adapter.py`.
- **Backend → LLM providers:** `providers/protocol.py` interface; concrete adapters in `providers/claude.py`, `providers/openai.py`.
- **Backend → Plugins:** `ingest/plugin_host.py` discovers and invokes; plugins never call app internals beyond `plugin_api`.
- **Backend → Filesystem:** only through `fs/` (writer, watcher, parser).
- **Backend → MCP:** `mcp/qmd_launcher.py` manages QMD's own MCP server as a side-process; we do not implement MCP ourselves.

**External integrations:**

- **LLM providers** (Claude, OpenAI) — outbound HTTPS, user-configured API key from keychain. NFR-S2.
- **Content sources on user paste** — outbound HTTPS to user-specified URLs (via plugins).
- No other external calls. No analytics, no update-check, no CDN, no auth provider.

**Data flow (happy path for a single capture):**

```
User paste on dashboard
   → POST /api/items
     → ingest/coordinator.py: immediately write stub .md via fs/writer.py
       → emit SSE ingest.progress {queued}
     → enqueue enrichment task
   (HTTP returns 201 with item_id)

Worker picks up task
   → ingest/plugin_host.py selects plugin (url_html / pdf / x_post / …)
   → plugin fetches + parses → {title, body, source, source_type}
     → emit SSE ingest.progress {fetching/parsing}
   → processor/pipeline.py:
     → providers/claude.py (or openai) summarize → TL;DR
     → search/qmd_adapter.py related_items → top-3 related
     → providers/claude.py suggest_shelf
     → emit SSE ingest.progress {summarizing}
   → fs/writer.py atomic update of .md (frontmatter enriched)
     → emit SSE ingest.progress {indexed}
   → QMD watcher picks up the changed file → index updated
     → emit SSE fs.change
Frontend useSSE receives events → useCaptureStore updates → IngestStatusList rerenders
```

### File Organization Patterns (Summary)

- **Config files:** all at repo root (`biome.json`, `pyproject.toml`, `package.json`) plus `web/` subset.
- **Source code:** `web/src/` (frontend), `src/latestnews/` (backend), `plugins/` (plugins).
- **Tests:** `tests/` tree for backend + e2e + regression; co-located `*.test.tsx` for frontend unit.
- **Assets:** `web/src/assets/` (frontend-bundled), `src/latestnews/preseed/content/` (backend-bundled).
- **Docs:** `!DOCS/` is the single documentation tree, self-indexed by the running product.

### Development Workflow Integration

**Dev server:**
- `npm run dev` at repo root.
- `concurrently` runs backend (`uv run uvicorn latestnews.app:create_app --reload --port 8000`) and frontend (`npm run dev --prefix web` on port 5173).
- Frontend Vite proxies `/api/*` to `http://localhost:8000`.
- Both HMR-live; Ctrl-C kills both.

**Build:**
- `npm run build` → `npm run build --prefix web` produces `web/dist/`.
- Backend `uv run python -m latestnews.build_assets` copies `web/dist/` into `src/latestnews/static/` (gitignored) so FastAPI can serve at `/`.

**Start (production-style local launch):**
- `npm run start` → single uvicorn process binds 127.0.0.1:8000 serving both API and bundled SPA.

**Test:**
- `npm run test` at root runs: Biome + Ruff lint, mypy + tsc, Vitest, pytest, search regression, Playwright e2e + axe.
- Each can also run standalone via sub-scripts.

**Deployment:**
- None (local-first). Phase-2 Tauri packaging will wrap `npm run start` into a native binary.

## Architecture Validation Results

### Coherence Validation ✅

**Decision compatibility.** All 49 core decisions are mutually consistent. No contradictory pairs identified:

- React + Vite + Biome — mainstream combination, no conflicts.
- Python 3.12 + FastAPI + uv + Ruff + mypy — modern Python stack, fully interoperable.
- Tailwind v4 + shadcn/ui + Motion — coexist by design; shadcn/ui components use Tailwind classes, Motion composes over any DOM.
- Zustand + TanStack Query — explicit separation (client vs. server state) prevents state duplication.
- React Router v7 loaders + TanStack Query — loaders prefetch; Query owns cache. Compatible.
- QMD (Python) + FastAPI + SSE — all Python async; no interop layer needed.
- OS keychain + pydantic-settings + `.env` fallback — layered credential access with clear precedence.

**Pattern consistency.** Implementation patterns align with the technology choices:

- `snake_case` wire format matches FastAPI + Pydantic defaults and `openapi-typescript` output; no translation layer.
- Dotted event type names (`chat.token`, `ingest.progress`) work equally in the Python `EventType` enum and the TypeScript discriminated union.
- Test co-location (frontend) vs. separate tree (backend) reflects community norms of Vitest and pytest respectively.
- Biome's default conventions for TS naming (PascalCase components, camelCase variables) match the documented rules mechanically.
- Ruff's default enforcement of PEP 8 matches the Python naming rules mechanically.

**Structure alignment.** The directory layout supports every decision:

- Subsystem boundaries in `src/latestnews/` mirror the 11 architectural components identified in Step 2.
- `fs/` as the single filesystem access point enforces NFR-R3 (atomic writes) and the "no direct markdown I/O elsewhere" rule.
- `search/sensitivity_middleware.py` as a single file enforces the "one implementation, three consumers" cross-cutting concern.
- `providers/protocol.py` + per-provider files enforces NFR-I1 (adapter-isolated integrations).
- `events/` module embodies the "unified SSE channel" decision.
- Frontend `features/` + `design/` + `components/ui/` separation enforces the component-boundary rules.

### Requirements Coverage Validation ✅

**Functional requirements.** All 44 FRs are mapped to specific frontend and backend locations in *Requirements-to-Structure Mapping*. Spot-checks on high-risk items:

- FR1, FR2 (paste/drop): `web/src/features/capture/CaptureInput.tsx` + `DropZone.tsx` ↔ `src/latestnews/ingest/coordinator.py` + `POST /api/items`.
- FR12, FR13 (LLM Provider Protocol + runtime switching): `src/latestnews/providers/protocol.py` + `selector.py` ↔ `web/src/features/settings/LlmProviderSection.tsx`.
- FR20–FR22 (chat with streaming): `web/src/features/chat/useChatStream.ts` + `web/src/lib/sse.ts` ↔ `src/latestnews/chat/orchestrator.py` + `/api/events` SSE.
- FR24 (optional MCP surface): `src/latestnews/mcp/qmd_launcher.py` (QMD's own MCP server as side-process).
- FR25 (sensitivity filtering): `src/latestnews/search/sensitivity_middleware.py` — enforced on search, chat, and MCP uniformly.
- FR29 (Explore animations + reduced-motion): `web/src/features/explore/ForceGraph.tsx` + `web/src/design/motion.ts`.
- FR35 (conflict resolution): `src/latestnews/fs/conflict_detector.py` ↔ `web/src/features/shelves/ConflictResolution.tsx` ↔ `/api/shelves/conflicts`.
- FR37 (pre-seed): `src/latestnews/preseed/pipeline.py` + bundled content under `preseed/content/`.
- FR43, FR44 (self-indexing docs): `qmd_adapter.py` scans `!DOCS/` alongside user corpus at boot.

No orphan FRs. Every FR traces to at least one file in the tree.

**Non-functional requirements — each addressed architecturally:**

| NFR | Architectural mechanism |
|-----|-------------------------|
| NFR-P1..P8 (latency) | Async pipeline, in-process QMD, SSE streaming, Vite bundle, WebGL graph |
| NFR-R1 (no data loss) | Write-through stub in `ingest/coordinator.py` before enrichment |
| NFR-R3 (atomic writes) | `fs/writer.py` temp-file-plus-rename |
| NFR-R4 (rebuildable index) | Index as derived state under `.latestnews/index/` |
| NFR-R5 (plugin isolation) | `ingest/plugin_host.py` asyncio-task + try/except; `plugin_api.py` as narrow surface |
| NFR-R6 (10 000 items) | TanStack Virtual on frontend lists; QMD handles index scale |
| NFR-S1 (localhost only) | uvicorn bind 127.0.0.1; no 0.0.0.0 |
| NFR-S2 (minimal egress) | Only user-triggered fetches + selected LLM provider |
| NFR-S3 (sensitivity) | `sensitivity_middleware.py` as single enforcement point |
| NFR-S5 (no telemetry) | No analytics dependencies in package.json or pyproject.toml |
| NFR-S6 (secrets) | `settings/secrets.py` via `keyring` → OS keychain |
| NFR-A1..A5 (a11y) | shadcn/ui + Radix primitives; axe-core CI; `prefers-reduced-motion` throughout motion system |
| NFR-I1..I4 (integrations) | `providers/protocol.py`, `mcp/qmd_launcher.py`, opaque filesystem watcher, markdown vault convention |
| NFR-Q1 (regression suite) | `tests/search_quality/` as first-class subsystem with CI gate |
| NFR-Q3 (plugin contract) | `tests/plugin_contract/` with fixtures |
| NFR-Q4 (AGENTS.md) | PR template gate |
| NFR-Q5 (self-indexing) | QMD scans `!DOCS/` on boot |
| NFR-Q6 (commit attribution) | PR template requires story ID |
| NFR-V1..V3 (visual polish) | Design tokens module, Motion library, external-reviewer judgment as CI-adjacent release gate |

**Measurable Outcomes coverage.** All 9 rows from the PRD's Measurable Outcomes table map to architectural mechanisms; none is orphaned.

### Implementation Readiness Validation ✅

**Decision completeness.** No versions pinned in this document (by design — lockfiles own that). Every architectural choice has a concrete target module or file.

**Structure completeness.** The full directory tree is enumerated — not a partial placeholder. A developer cloning this doc could recreate the scaffold from scratch.

**Pattern completeness.** Naming, structure, format, state, error, loading, logging, commit, PR patterns all covered. Enforcement split between mechanical (Biome, Ruff, mypy, tsc) and review-enforced rules documented explicitly.

### Gap Analysis

**Critical gaps:** **none.** Implementation can begin.

**Important gaps (should be resolved early, not blocking Epic 1):**

1. **QMD API shape is not yet documented here.** The `search/qmd_adapter.py` file is named but its actual interface (call signatures, return types, configuration) depends on QMD's current public surface. Resolution: when the scaffold story runs, the dev should read QMD's documentation, sketch the adapter shape, and commit a short ADR (`!DOCS/planning-artifacts/adr/001-qmd-adapter.md`) before building dependent features.
2. **Motion system specifics not pinned.** Duration scale, easing curves, and standard variants (`enter`, `exit`, `pulse`, `settle`) are referenced as existing but not specified. Resolution: this should be the first task of the UX design phase (`bmad-create-ux-design`) and committed to `web/src/design/motion.ts` as the canonical values.
3. **Plugin `IngestResult` contract shape.** `plugin_host.py` names the contract but does not define the exact fields. Resolution: define in `plugin_api.py` during the plugin-architecture story (Epic 8 per the readiness report).

**Nice-to-have gaps (safely post-MVP):**

- Specific error `code` strings for every error case. Will accumulate as features are built.
- Performance benchmark fixtures. Will emerge during the search-regression-suite story.
- Schema-version migration examples. Will emerge when the first migration is needed.

### Validation Issues Addressed

None of the validation issues found require architectural changes. The three "important gaps" are resolvable within early implementation stories without altering the architecture's shape.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (Step 2)
- [x] Scale and complexity assessed (medium; 11 components)
- [x] Technical constraints identified (React, QMD, Python plugins, local-first)
- [x] Cross-cutting concerns mapped (8 concerns, each with a home in the structure)

**✅ Starter & Architectural Decisions**
- [x] Starter scaffold specified (Vite React TS + FastAPI + uv)
- [x] Critical decisions documented (49 decisions across 5 categories)
- [x] Technology stack fully specified (no `TBD` entries)
- [x] Integration patterns defined (SSE, REST, Provider Protocol, plugin contract)
- [x] Performance considerations addressed (NFR-P1–P8 mapped to mechanisms)

**✅ Implementation Patterns**
- [x] Naming conventions established (Python, TS, wire format, events, stores, files)
- [x] Structure patterns defined (feature-first frontend, subsystem-first backend)
- [x] Communication patterns specified (REST + SSE, event envelope, Zustand + Query boundary)
- [x] Process patterns documented (errors, loading, logging, commits, PRs)
- [x] Anti-patterns explicitly listed

**✅ Project Structure**
- [x] Complete directory structure defined (full tree, not placeholders)
- [x] Component boundaries established (API, component, service, data)
- [x] Integration points mapped (16-row API table + internal + external)
- [x] Requirements-to-structure mapping complete (all 44 FRs + cross-cutting concerns)

### Architecture Readiness Assessment

**Overall status:** **READY FOR IMPLEMENTATION.**

**Confidence level:** **High.** The architecture is complete, internally consistent, fully covers the 44 FRs and 38 NFRs from the PRD, and leaves no critical ambiguity. The three "important gaps" are operational rather than architectural.

**Key strengths:**

- **Single-enforcement-point discipline.** Sensitivity (one file), LLM providers (one protocol), markdown I/O (one module), SSE events (one channel), design tokens (one source) — each cross-cutting concern has exactly one home.
- **Adapter-isolated external dependencies.** QMD, MCP, each LLM provider wrapped so a breaking change upstream is a one-file edit.
- **Filesystem as source of truth.** Index is derived; user data is always just markdown. No lock-in, no migration ceremony for users.
- **Plugin architecture without third-party plugins shipped.** The contract is defined and tested but no external code runs in MVP — the hard part (isolation, contract testing) is built; the easy part (more plugins) is incremental.
- **Quality infrastructure as first-class.** Search regression suite, plugin contract tests, accessibility lint, visual-polish external review — all baked into CI or release gates.
- **Zero surprise integrations.** No analytics, no update-check, no CDN, no third-party auth. Network egress is auditable and explicit.

**Areas for future enhancement (not blocking MVP):**

- Subprocess-based plugin isolation if asyncio-task isolation proves insufficient.
- Tauri wrapper for one-click install (Phase 2).
- Telegram bot and auto-discovery crawler (Phase 2 ingest sources).
- More LLM provider adapters (Ollama, Gemini) — drop-in per the protocol.
- Schema migration tooling once first real migration is needed.
- Observability beyond local logs (only post-MVP, and only opt-in per NFR-S5).

### Implementation Handoff

**AI agent guidelines:**

- Follow all architectural decisions and patterns in this document exactly as written. Deviations must be justified in PR description.
- Use `AGENTS.md` as the operational companion to this architecture. When they conflict, update both in the same PR.
- Respect the single-enforcement-point discipline: if a concern appears solvable in two places, one of them is already wrong.
- Refer to the Requirements-to-Structure Mapping table for placement decisions.
- Use the PRD's Measurable Outcomes table as the definition of "done" for MVP.

**First implementation priority:**

```bash
# At repository root (to be run as Epic 1, Story 1)
npm create vite@latest web -- --template react-ts
cd web && npm install && cd ..
uv init
uv add fastapi uvicorn watchdog pydantic-settings structlog keyring
uv add --dev pytest pytest-asyncio ruff mypy hypothesis
# Then author: AGENTS.md stub, root package.json with concurrently,
# biome.json, pyproject.toml Ruff+mypy config, scripts/dev.sh,
# tests/search_quality/gold_dataset/ placeholder, and confirm
# `npm run dev` reaches "Hello LatestNews" at localhost:5173.
```

**Next planning workflows (from the readiness report):**

1. `bmad-create-ux-design` — concrete design tokens, wireframes, motion spec.
2. `bmad-create-epics-and-stories` — turn the 44 FRs into 9 proposed epics with acceptance criteria.
3. `bmad-check-implementation-readiness` — re-run now that architecture exists; architecture gap in the report will close.

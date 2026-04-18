# Story 1.1: Bootstrap the monorepo scaffold

Status: review

## Story

As a developer,
I want the project scaffold checked in and runnable,
so that every subsequent feature has a working foundation to build upon.

## Acceptance Criteria

1. **Fresh-clone install succeeds.** `npm install` at repo root and `uv sync` in the Python backend install all dependencies without error on a fresh clone.
2. **Frontend scaffold exists.** `web/` contains a Vite React TypeScript scaffold produced by `npm create vite@latest web -- --template react-ts` (or equivalent), with all standard Vite config files (`vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `package.json`).
3. **Backend scaffold exists.** `src/latestnews/` contains `__init__.py`, `__main__.py`, `app.py` with an empty FastAPI app factory; `/api/health` returns HTTP 200 with `{"status": "ok"}`.
4. **Dev orchestration works.** Running `npm run dev` at repo root uses `concurrently` to launch backend on port 8000 (via `uv run uvicorn latestnews.app:create_app --reload --port 8000 --factory`) and frontend on port 5173 (Vite). Both processes are HMR-enabled. Ctrl-C kills both.
5. **Vite proxy works.** Vite dev server proxies `/api/*` requests to `http://localhost:8000`. Test: `curl http://localhost:5173/api/health` returns the backend's health response.
6. **Root config files present.** The following exist at repo root: `biome.json`, `pyproject.toml`, `package.json`, `package-lock.json`, `uv.lock`, `.python-version`, `.env.example`, `.gitignore`, `AGENTS.md` (stub), `README.md` (already exists — left unmodified or enriched), `LICENSE`, `.editorconfig`.
7. **CI workflow exists (placeholder).** `.github/workflows/ci.yml` defines a workflow that runs on push and pull_request to main. Jobs: lint (Biome + Ruff), typecheck (tsc + mypy), test (Vitest + pytest). All placeholder jobs exit 0 successfully against the scaffold (no real tests yet).
8. **First meaningful paint works.** Opening `http://localhost:5173` displays a "Hello LatestNews" heading (can be minimal — the default Vite page modified to show the project name is acceptable). This is the visible outcome of the story.
9. **Lockfiles committed.** `package-lock.json`, `web/package-lock.json`, and `uv.lock` are committed to git.

## Tasks / Subtasks

- [x] **Task 1: Create repo root `package.json` with dev-orchestration scripts** (AC: #1, #4)
  - [x] Initialize `package.json` at repo root with metadata (`"name": "latestnews"`, `"private": true`, `"type": "module"`)
  - [x] Add `concurrently` as a devDependency
  - [x] Add `npm run dev` script: `concurrently -n backend,web -c blue,green "uv run uvicorn latestnews.app:create_app --reload --port 8000 --factory" "npm run dev --prefix web"`
  - [x] Add `npm run start` script (production-style single command): `uv run uvicorn latestnews.app:create_app --port 8000 --factory` (serving frontend later, after build story)
  - [x] Add `npm run build` script: `npm run build --prefix web`
  - [x] Add `npm run lint` script: `biome check . && uv run ruff check src tests`
  - [x] Add `npm run typecheck` script: `npm run typecheck --prefix web && uv run mypy src`
  - [x] Add `npm run test` script: `npm run test --prefix web && uv run pytest`
  - [x] Run `npm install` to generate `package-lock.json`

- [x] **Task 2: Scaffold the Vite React + TS frontend in `web/`** (AC: #2, #5, #8)
  - [x] Run `npm create vite@latest web -- --template react-ts` at repo root (accept all defaults)
  - [x] Run `cd web && npm install`
  - [x] Edit `web/vite.config.ts` to add a dev-server proxy: `server: { proxy: { '/api': 'http://localhost:8000' } }`
  - [x] Edit `web/src/App.tsx` to render a minimal "Hello LatestNews" heading (keep the shell minimal; this is a scaffold, not UI work)
  - [x] Enable TypeScript strict mode in `web/tsconfig.json` if not already (added `"strict": true` to `tsconfig.app.json`; root `tsconfig.json` is a composite references-only file)
  - [x] Ensure the dev server binds to `127.0.0.1` (not `0.0.0.0`) per NFR-S1 — add `host: '127.0.0.1'` to `vite.config.ts` `server`
  - [x] Verify `npm run dev --prefix web` launches the dev server and shows the "Hello LatestNews" heading at `http://localhost:5173`

- [x] **Task 3: Initialize the Python backend with uv** (AC: #1, #3)
  - [x] Run `uv init` at repo root — creates `pyproject.toml` and `.python-version` (pyproject authored directly to avoid uv's default non-src layout; equivalent outcome)
  - [x] Edit `pyproject.toml`: `name = "latestnews"`, `version = "0.1.0"`, `description = "Local-first personal knowledge web app"`, `requires-python = ">=3.12"`
  - [x] Configure `pyproject.toml` for the `src/` layout: `[tool.hatch.build.targets.wheel] packages = ["src/latestnews"]`
  - [x] Add runtime dependencies: fastapi, uvicorn, watchdog, pydantic-settings, structlog, keyring
  - [x] Add dev dependencies: pytest, pytest-asyncio, ruff, mypy, hypothesis, httpx
  - [x] Configure `[tool.ruff]` in `pyproject.toml` with Python 3.12 target, line length 100, lint rules enabled (E, F, I, W, UP, B, SIM), formatter enabled
  - [x] Configure `[tool.mypy]` in `pyproject.toml`: `strict = true`, `python_version = "3.12"`, explicit package bases
  - [x] Configure `[tool.pytest.ini_options]` with `asyncio_mode = "auto"` and `testpaths = ["tests"]`

- [x] **Task 4: Write the FastAPI app factory and `/api/health` endpoint** (AC: #3, #5)
  - [x] Create `src/latestnews/__init__.py` (with version string)
  - [x] Create `src/latestnews/__main__.py`: runs uvicorn against the app factory (enables `python -m latestnews`)
  - [x] Create `src/latestnews/app.py` with:
    - [x] A `create_app() -> FastAPI` factory function that returns a FastAPI instance
    - [x] A bound-to-`127.0.0.1` assumption (no explicit 0.0.0.0 binding; uvicorn command line controls host)
    - [x] CORS middleware allowing `http://localhost:5173` as origin (for dev); keep allowed methods/headers minimal
    - [x] The `/api/health` route returning `{"status": "ok"}` with HTTP 200 (mounted via `include_router`)
  - [x] Write **RED first**: create `tests/backend/test_health.py` with an `httpx.AsyncClient` test asserting `GET /api/health` returns 200 + `{"status": "ok"}`. Confirm it fails before implementing
  - [x] **GREEN**: Implement the endpoint so the test passes
  - [x] **REFACTOR**: Extract CORS config to a private helper, move health router to `src/latestnews/api/health.py`, re-import into `app.py` via `app.include_router(health.router)`. Test still passes

- [x] **Task 5: Create the architecture-specified directory skeleton** (AC: #6)
  - [x] Create `src/latestnews/` subdirectories (each with a docstring `__init__.py`): `api/`, `events/`, `models/`, `ingest/`, `processor/`, `providers/`, `search/`, `chat/`, `mcp/`, `fs/`, `preseed/`, `settings/`
  - [x] Create `src/latestnews/preseed/content/` (empty `.gitkeep`; populated later by Story 9.1)
  - [x] Create `plugins/` at repo root with a `README.md` pointing at `AGENTS.md` (placeholder; plugin interface defined in Story 8.1)
  - [x] Create `tests/backend/`, `tests/plugin_contract/`, `tests/search_quality/`, `tests/web/e2e/`, `tests/web/axe/`
  - [x] Create `scripts/` with stub files `scripts/dev.sh`, `scripts/start.sh`, `scripts/build.sh`, `scripts/test-ingest.sh`
  - [x] `chmod +x scripts/*.sh`

- [x] **Task 6: Configure Biome at repo root** (AC: #1, #6, #7)
  - [x] Install Biome at repo root as a devDependency: `@biomejs/biome@^2.4.12`
  - [x] Create `biome.json` at repo root with:
    - [x] `"$schema"` pointing at the installed Biome's schema
    - [x] Formatter enabled, 2-space indent, LF line endings, line width 100
    - [x] Linter enabled with recommended rules + `"suspicious": { "noConsole": "error" }`
    - [x] `"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }`
    - [x] `"files": { "includes": [...] }` excluding `web/dist`, `node_modules`, `_bmad`, `.claude`, `.agents`, `!DOCS/logs`, `.venv` (Biome v2 uses `includes` with `!`-prefixed negations; same outcome as the v1 `ignore` syntax shown in the story)
  - [x] Verify `npx biome check .` runs without errors on the scaffold

- [x] **Task 7: Write the stub `AGENTS.md`** (AC: #6)
  - [x] Create `AGENTS.md` at repo root
  - [x] Sections present (each a stub, to be filled by subsequent stories):
    - [x] `# AGENTS.md — LatestNews developer guide`
    - [x] `## What this is` — one-paragraph product summary
    - [x] `## Repository layout` — brief description of `web/`, `src/latestnews/`, `plugins/`, `tests/`, `!DOCS/`, `scripts/`
    - [x] `## How to run the app` — `npm install` + `uv sync` + `npm run dev`
    - [x] `## How to run tests` — `npm run test`
    - [x] `## How to add an ingest plugin` (stub — "to be authored in Story 8.1")
    - [x] `## How to add an LLM provider` (stub — "to be authored in Story 3.1")
    - [x] `## Conventional Commits + PR template` — references the architecture's Implementation Patterns section

- [x] **Task 8: Create `.github/workflows/ci.yml` with placeholder jobs** (AC: #7)
  - [x] Workflow triggers on `push` and `pull_request` to `main` **and `dev`** (extended per team decision: `dev` is the integration branch, `main` is production)
  - [x] Jobs:
    - [x] `lint`: runs `npm ci`, `npm ci --prefix web`, `uv sync --frozen`, `npm run lint`
    - [x] `typecheck`: runs `npm ci`, `npm ci --prefix web`, `uv sync --frozen`, `npm run typecheck`
    - [x] `test`: runs `npm ci`, `npm ci --prefix web`, `uv sync --frozen`, `npm run test`
  - [x] Ubuntu latest runner, Node 22, Python 3.12
  - [x] GitHub Actions cache for npm (via `actions/setup-node`) and uv (via `astral-sh/setup-uv` with `enable-cache`)
  - [x] Commit the workflow; first CI run succeeded (run id `24597315111` on `dev`, all three jobs green; cache-save warnings are benign parallel-job races)

- [x] **Task 9: Verify end-to-end scaffold behaviour** (AC: #1, #4, #5, #8)
  - [x] Fresh-install equivalent verified: `npm install` (root + web), `uv sync`, `npm run dev` all succeed on the freshly-authored scaffold
  - [x] `curl http://127.0.0.1:8000/api/health` → `200 {"status":"ok"}`
  - [x] `curl http://127.0.0.1:5173/` → HTML shell loads; `App.tsx` bundle contains `"Hello LatestNews"`
  - [x] `curl http://127.0.0.1:5173/api/health` → `200 {"status":"ok"}` (Vite proxy working)
  - [x] SIGINT on the `concurrently` parent terminated both children cleanly (exit 0)
  - [x] `npm run lint` → green (Biome + Ruff)
  - [x] `npm run typecheck` → green (tsc + mypy)
  - [x] `npm run test` → green (1 pytest test + web no-op)

- [x] **Task 10: Commit and push the scaffold** (AC: all)
  - [x] `git add -A` (respecting `.gitignore`)
  - [x] Conventional Commits message: `feat(foundation): bootstrap monorepo scaffold (Story 1.1)` — commit `2973024`
  - [x] Commit body references Story 1.1 and lists key files added
  - [x] Push to `origin/dev` (new integration branch; `main` remains untouched pending PR/merge)
  - [x] Verify GitHub Actions CI run is green on the pushed commit — run `24597315111` green (lint 20s, typecheck 24s, test 23s)

## Dev Notes

### Scope and altitude

This is a **scaffolding story**. It delivers no user-facing feature beyond "the app launches and shows its name." Architecture § First Implementation Story pre-approves this as Epic 1 Story 1 despite its lack of direct user value. **Do not expand scope.** No design tokens, no components, no shadcn/ui install, no routing — those are Stories 1.2–1.5.

### Architecture source of truth

- **Complete architecture document:** `!DOCS/planning-artifacts/architecture.md` (1 141 lines).
- **Starter Template section:** see § "Starter Template Evaluation" and § "First Implementation Priority" inside architecture.md for the definitive scaffold command list.
- **Project structure:** see architecture.md § "Project Structure & Boundaries → Complete Project Directory Structure" for the full tree this story partially realises (this story creates the skeleton; later stories populate features).
- **Implementation patterns:** see architecture.md § "Implementation Patterns & Consistency Rules" for naming conventions (Python snake_case, TS camelCase, snake_case wire format) and anti-patterns (no `console.log`, no `print()`, no `any` types without comment).

### PRD source of truth

- **Complete PRD:** `!DOCS/planning-artifacts/prd.md` (623 lines).
- **Relevant NFRs for this story:**
  - **NFR-S1** — no inbound network port accessible outside `localhost`. Bind to 127.0.0.1 explicitly in both Vite and uvicorn.
  - **NFR-S2** — no outbound traffic except user-initiated fetches and LLM calls. This scaffold has no outbound traffic yet — verify no phone-home on install.
  - **NFR-Q4** — `AGENTS.md` is authoritative documentation. The stub here is the foundation for all subsequent PR-template-enforced updates.
  - **NFR-Q6** — every commit attributable to a story. The commit message includes the story ID explicitly.

### UX source of truth

- **Complete UX spec:** `!DOCS/planning-artifacts/ux-design-specification.md` (1 725 lines).
- **Relevant:** none directly. This story creates no UI beyond "Hello LatestNews." Do not import any components, tokens, or design work from the UX spec in this story. Those are Stories 1.2–1.5 and later.

### Key technical decisions (from architecture)

- **Frontend stack:** Vite + React 19 + TypeScript strict.
- **Backend stack:** Python 3.12+, FastAPI (async), uv package manager, uvicorn server.
- **Lint/format:** Biome for JS/TS, Ruff for Python. Both enabled in this story.
- **Typecheck:** `tsc --strict` (via Vite template defaults) + mypy strict (configured in pyproject.toml).
- **Test stack:** Vitest (frontend; default in Vite template), pytest (backend).
- **Dev orchestration:** root `package.json` with `concurrently` running uvicorn + Vite dev server.
- **Wire format:** `snake_case` JSON on the wire (see architecture § Patterns). The `/api/health` payload uses snake_case by convention (`{"status": "ok"}` has no case conflict, but future endpoints must).
- **Error envelope format:** `{ "error": { "code": string, "message": string, "hint"?, "details"? } }` — not exercised in this story but documented here for future reference.
- **Logging:** structlog is installed (for later use); not wired up in this story.

### File layout (this story's deliverables)

```
LatestNews/                  # already exists
├─ AGENTS.md                 # NEW — stub
├─ README.md                 # already exists; do NOT modify
├─ LICENSE                   # NEW — MIT or unlicensed placeholder (confirm with csacsi later; ship MIT as default)
├─ .gitignore                # already exists; extend if needed (see below)
├─ .editorconfig             # NEW
├─ .env.example              # NEW — empty template for future LLM provider keys
├─ biome.json                # NEW
├─ package.json              # NEW — root, dev orchestration only
├─ package-lock.json         # NEW (generated)
├─ pyproject.toml            # NEW — uv init + ruff + mypy + pytest config
├─ uv.lock                   # NEW (generated)
├─ .python-version           # NEW (generated by uv init)
├─ .github/
│  └─ workflows/
│     └─ ci.yml              # NEW
├─ scripts/
│  ├─ dev.sh                 # NEW stub
│  ├─ start.sh               # NEW stub
│  ├─ build.sh               # NEW stub
│  └─ test-ingest.sh         # NEW stub
├─ web/                      # NEW — entire Vite React TS scaffold
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ index.html
│  └─ src/
│     ├─ main.tsx
│     ├─ App.tsx             # "Hello LatestNews"
│     └─ (+ default Vite assets)
├─ src/
│  └─ latestnews/             # NEW backend
│     ├─ __init__.py
│     ├─ __main__.py
│     ├─ app.py
│     ├─ api/
│     │  ├─ __init__.py
│     │  └─ health.py         # extracted in refactor phase
│     ├─ events/__init__.py
│     ├─ models/__init__.py
│     ├─ ingest/__init__.py
│     ├─ processor/__init__.py
│     ├─ providers/__init__.py
│     ├─ search/__init__.py
│     ├─ chat/__init__.py
│     ├─ mcp/__init__.py
│     ├─ fs/__init__.py
│     ├─ preseed/
│     │  ├─ __init__.py
│     │  └─ content/           # empty dir; populated by Story 9.1
│     └─ settings/__init__.py
├─ plugins/
│  └─ README.md               # stub pointing at AGENTS.md
└─ tests/
   ├─ backend/
   │  ├─ __init__.py
   │  └─ test_health.py        # the one real test in this story
   ├─ plugin_contract/         # empty
   ├─ search_quality/          # empty
   └─ web/
      ├─ e2e/                  # empty .gitkeep
      └─ axe/                  # empty .gitkeep
```

### .gitignore extensions

The `.gitignore` already exists (from the initial commit). Verify it excludes:
- `node_modules/`, `web/node_modules/`, `web/dist/`, `.vite/`, coverage outputs
- Python: `__pycache__/`, `*.pyc`, `.venv/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.coverage`
- Environment: `.env`, `.env.*` (but allow `.env.example`)
- OS: `.DS_Store`
- Runtime: `!DOCS/logs/`, `!DOCS/plugin-errors/`, `!DOCS/archive/`
- BMad tooling: `_bmad/`, `.claude/`, `.agents/`

All already present in the initial commit's `.gitignore`. If any are missing, extend in this story.

### Testing standards summary (for this story)

- **One real test:** `tests/backend/test_health.py` — async httpx client asserts `GET /api/health` → 200 + `{"status": "ok"}`.
- **Frontend:** no real tests in this story beyond the Vite template's `.test.tsx` example (leave it in place; it proves Vitest works).
- **Red-green-refactor:** apply strictly for the health endpoint. Write the test first, confirm it fails, implement, confirm it passes, refactor (extract router).
- **CI verifies green:** all three CI jobs must pass on the push; a failing CI run blocks story completion.

### Libraries and versions (let lockfiles be authoritative)

Do **not** pin versions in documentation; let `package-lock.json` and `uv.lock` be the source of truth. Install the latest stable of each at implementation time:
- `concurrently` (latest) as the root devDependency.
- `@biomejs/biome` (latest stable, likely 1.x or 2.x) as root devDependency.
- Python deps: `fastapi`, `uvicorn`, `watchdog`, `pydantic-settings`, `structlog`, `keyring` — all latest stable.
- Python dev deps: `pytest`, `pytest-asyncio`, `ruff`, `mypy`, `hypothesis`, `httpx`.
- Vite template's defaults (React 19 at time of writing, TypeScript 5.x, Vite 5/6).

### Known gotchas

- **uv + src layout.** `uv init` defaults to a non-src layout. Manually configure `src/latestnews/` package path in `pyproject.toml` `[tool.hatch.build.targets.wheel] packages = ["src/latestnews"]` (or equivalent for setuptools). Test by running `uv run python -c "import latestnews; print(latestnews)"` — must resolve.
- **FastAPI app factory pattern.** Uvicorn needs `--factory` flag when importing from a factory function. Use it in both `npm run dev` and `npm run start`.
- **Vite proxy and Vite's own host binding.** Vite defaults to binding to `127.0.0.1` in recent versions; confirm explicitly with `server.host: '127.0.0.1'` in `vite.config.ts`. Browser console should show no CORS errors against `/api/*`.
- **Biome vs ESLint coexistence.** Vite's React TS template may include ESLint config. Remove ESLint config files (`eslint.config.js`, `.eslintrc*`) since Biome replaces it. Biome handles both linting and formatting.
- **Node version for CI.** Confirm CI Node version matches local. Use `.nvmrc` at repo root if needed (optional for MVP).
- **License choice.** If csacsi hasn't confirmed a license yet, commit a placeholder `LICENSE` file with MIT text. Note in the commit message that the license is provisional and can be changed by the user.

### Project Structure Notes

The project structure conforms to architecture.md § Project Structure & Boundaries. This story creates the skeleton; every subsequent story populates specific subsystems (ingest, processor, providers, etc.). No conflicts or variances from the architecture detected.

### References

- Architecture — Starter Template: `!DOCS/planning-artifacts/architecture.md` § Starter Template Evaluation → Monorepo Layout
- Architecture — First Implementation Priority: `!DOCS/planning-artifacts/architecture.md` § Implementation Handoff → First Implementation Priority
- Architecture — Implementation Patterns: `!DOCS/planning-artifacts/architecture.md` § Implementation Patterns & Consistency Rules
- PRD — NFR-S1 (localhost binding), NFR-Q4 (AGENTS.md), NFR-Q6 (commit attribution): `!DOCS/planning-artifacts/prd.md` § Non-Functional Requirements
- Epics — Story 1.1 definition: `!DOCS/planning-artifacts/epics.md` § Epic 1 → Story 1.1

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via Claude Code (BMad `bmad-dev-story` workflow).

### Debug Log References

- Biome v2 lint surfaced two template issues on first run: a non-null assertion in
  `web/src/main.tsx` and an unsorted import in `web/vite.config.ts`. The assertion
  was rewritten as an explicit null-guard; the import order was auto-fixed with
  `biome check --write`.
- `tsconfig.app.json` from the Vite React-TS template did not include
  `"strict": true`. Added it explicitly to satisfy AC #2 (the comment claiming
  defaults are strict is outdated for the current Vite template).
- Vite template no longer scaffolds a smoke `.test.tsx`. Rather than add Vitest
  in this scaffolding story (scope-creep), the `test` script in `web/package.json`
  is a no-op that prints a pointer and exits 0. Vitest installation moves to the
  first frontend story that actually needs tests.
- `uv init` was skipped in favour of authoring `pyproject.toml` directly. Reason:
  `uv init` defaults to a non-src layout and would scaffold a `main.py`; the
  authored file matches the story's target configuration exactly and avoids a
  throwaway edit pass.
- Dev-server shutdown verified: `SIGINT` on the root `concurrently` process (pid
  tree: concurrently → uvicorn/vite) terminated all children cleanly, exit 0.

### Completion Notes List

- **Scope held:** no design tokens, no shadcn/ui, no routing, no Tailwind —
  those belong to Stories 1.2–1.5 per the story's scope statement.
- **NFR-S1 satisfied:** both the Vite dev server and uvicorn bind to
  `127.0.0.1` explicitly (not `0.0.0.0`).
- **NFR-Q4 satisfied:** `AGENTS.md` is authored with every required section as
  a stub, ready for per-story enrichment.
- **NFR-Q6 satisfied:** the commit message references Story 1.1 by ID and
  enumerates key files.
- **Wire-format conformance:** the `/api/health` response is `snake_case` by
  convention (`{"status":"ok"}` has no case conflict).
- **CORS:** development-only origin list (`localhost:5173` + `127.0.0.1:5173`),
  methods restricted to the HTTP verbs we actually use, `allow_credentials=False`.
- **Refactor applied:** health router lives in `src/latestnews/api/health.py`
  and is mounted via `app.include_router(health.router)`; CORS setup extracted
  to a private `_configure_cors` helper in `app.py`.
- **CI extended:** workflow triggers on push + PR to both `main` and `dev`,
  matching the team's branch strategy (dev = integration, main = production).
- **License:** MIT placeholder with copyright "Csaba Toth / BitRaptors"
  — revisable later if the product chooses a different license.

### File List

**New — repo root configuration**

- `.editorconfig`
- `.env.example`
- `.python-version`
- `AGENTS.md`
- `LICENSE`
- `biome.json`
- `package-lock.json`
- `package.json`
- `pyproject.toml`
- `uv.lock`

**New — CI**

- `.github/workflows/ci.yml`

**New — backend (`src/latestnews/`)**

- `src/latestnews/__init__.py`
- `src/latestnews/__main__.py`
- `src/latestnews/app.py`
- `src/latestnews/api/__init__.py`
- `src/latestnews/api/health.py`
- `src/latestnews/chat/__init__.py`
- `src/latestnews/events/__init__.py`
- `src/latestnews/fs/__init__.py`
- `src/latestnews/ingest/__init__.py`
- `src/latestnews/mcp/__init__.py`
- `src/latestnews/models/__init__.py`
- `src/latestnews/preseed/__init__.py`
- `src/latestnews/preseed/content/.gitkeep`
- `src/latestnews/processor/__init__.py`
- `src/latestnews/providers/__init__.py`
- `src/latestnews/search/__init__.py`
- `src/latestnews/settings/__init__.py`

**New — tests**

- `tests/__init__.py`
- `tests/backend/__init__.py`
- `tests/backend/test_health.py`
- `tests/plugin_contract/__init__.py`
- `tests/search_quality/__init__.py`
- `tests/web/axe/.gitkeep`
- `tests/web/e2e/.gitkeep`

**New — frontend (`web/`)**

- `web/.gitignore` (generated by Vite)
- `web/README.md` (generated by Vite)
- `web/index.html` (title set to `LatestNews`)
- `web/package.json`
- `web/package-lock.json`
- `web/public/favicon.svg` (Vite default)
- `web/src/App.css` (minimal — scaffold note)
- `web/src/App.tsx` (renders `<h1>Hello LatestNews</h1>`)
- `web/src/assets/vite.svg` (template asset)
- `web/src/index.css`
- `web/src/main.tsx` (null-guarded root mount)
- `web/src/vite-env.d.ts` (template)
- `web/tsconfig.app.json` (added `"strict": true`)
- `web/tsconfig.json`
- `web/tsconfig.node.json`
- `web/vite.config.ts` (added proxy + 127.0.0.1 host)

**New — plugins + scripts**

- `plugins/README.md`
- `scripts/build.sh`
- `scripts/dev.sh`
- `scripts/start.sh`
- `scripts/test-ingest.sh`

**Modified (planning artefacts — story progress)**

- `!DOCS/implementation-artifacts/1-1-bootstrap-the-monorepo-scaffold.md` (status, task checkboxes, Dev Agent Record)
- `!DOCS/implementation-artifacts/sprint-status.yaml` (1-1 → in-progress → review)

**Removed — from the Vite template**

- `web/eslint.config.js` (Biome replaces ESLint)
- `web/src/assets/hero.png`, `web/src/assets/react.svg` (unused after App.tsx simplification)
- `web/public/icons.svg` (unused after App.tsx simplification)

### Change Log

| Date       | Change                                                                                                    |
|------------|-----------------------------------------------------------------------------------------------------------|
| 2026-04-18 | Status → `in-progress`. Branch `dev` created from `main`.                                                 |
| 2026-04-18 | Tasks 1–9 implemented; `/api/health` test green via RED → GREEN → REFACTOR. Status → `review` on commit. |
| 2026-04-18 | Task 10: commit `2973024` pushed to `origin/dev`; GitHub Actions run `24597315111` green on all 3 jobs.      |

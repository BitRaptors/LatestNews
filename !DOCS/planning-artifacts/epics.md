---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-04-17'
inputDocuments:
  - '!DOCS/planning-artifacts/prd.md'
  - '!DOCS/planning-artifacts/architecture.md'
  - '!DOCS/planning-artifacts/ux-design-specification.md'
  - '!DOCS/brainstorming/brainstorming-session-2026-04-17-1430.md'
  - '!DOCS/planning-artifacts/implementation-readiness-report-2026-04-17.md'
project_name: 'LatestNews'
---

# LatestNews — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for LatestNews, decomposing requirements from the PRD (44 FRs, 38 NFRs), Architecture (49 core decisions + patterns), and UX Design Specification (design tokens, 25-component strategy, "The Atrium" direction) into implementable stories ready for the Developer agent.

## Requirements Inventory

### Functional Requirements

**Capture & Ingest**
- FR1: User can paste one or more URLs into the capture input and submit them in a single action.
- FR2: User can drag and drop files (PDF, image, markdown) onto the capture surface for ingest.
- FR3: System can ingest content from URLs pointing to HTML pages, X posts, YouTube videos, PDF documents, and image files.
- FR4: Capture is non-blocking — the user can continue using the app while ingest runs asynchronously in the background.
- FR5: System provides visible per-item progress feedback during ingest (queued → fetching → parsing → summarizing → indexed).
- FR6: System handles ingest failures without data loss — failed items appear in an inbox / error state with the original URL preserved and a retry action.
- FR7: System can be extended to support additional content sources via drop-in plugins that conform to a documented interface, without modifications to the app core.

**AI Content Processing**
- FR8: System automatically generates a concise summary (TL;DR) for each ingested item.
- FR9: System automatically suggests related existing items for each newly ingested item.
- FR10: System automatically suggests a shelf for each newly ingested item based on its content.
- FR11: User can override, replace, or regenerate any AI-generated field (summary, shelf, related items).
- FR12: All AI operations route through a pluggable LLM Provider Protocol. Claude and OpenAI are supported in MVP.
- FR13: User can select and switch the active LLM provider at runtime; the change takes effect without application restart.

**Search & Retrieval**
- FR14: User can issue a text query and receive ranked results across the entire searchable corpus.
- FR15: Search results combine BM25, vector, and LLM reranking signals, tuned to favor conceptual re-encounter.
- FR16: Search results display title, source, shelf, date, and excerpt for each hit.
- FR17: User can give thumbs-up / thumbs-down feedback on any item; feedback persisted to frontmatter; influences rerank.
- FR18: User can filter search results by shelf.
- FR19: User can open any search result to see the full item.

**Chat & Conversation**
- FR20: User can ask natural-language questions in a dashboard chat panel and receive synthesized answers drawn only from their own corpus.
- FR21: Chat responses cite source items; citations link back to the underlying markdown file.
- FR22: Chat responses stream token-by-token.
- FR23: System offers starter prompt templates (compare-items, detect-similar-new-item).
- FR24: System exposes the same retrieval capability as an optional MCP server for external LLM clients.
- FR25: Chat answers respect sensitivity rules — `personal` items excluded from shared/public contexts.

**Exploration & Visualization**
- FR26: User can open an Explore page that visualizes the corpus as a force-directed topic graph.
- FR27: User can hover, click, drag nodes; clicking opens item detail.
- FR28: User can filter Explore graph by shelf.
- FR29: Explore graph animates state transitions; honors `prefers-reduced-motion`.
- FR30: Storage is fully compatible with Obsidian vault conventions without modification.

**Shelves, Sensitivity & Multi-User**
- FR31: User can organize items into shelves (subfolders of data root).
- FR32: User can move items between shelves and delete items.
- FR33: Every item carries `sensitivity` field (`personal` / `shared` / `publishable`), editable, defaulting to `personal`.
- FR34: User can configure shared shelves via filesystem folder paths.
- FR35: System detects filesystem conflict artefacts; single-click resolution UI.
- FR36: System re-indexes and refreshes UI on external filesystem changes automatically.

**Onboarding**
- FR37: On first launch with empty data root, system pre-seeds corpus with curated items.
- FR38: User can dismiss or replace pre-seeded items individually, or clear all at once.
- FR39: Pre-seed content is clearly marked in UI until user keeps or removes it.

**Settings & Extensibility**
- FR40: User can configure data-root and shared-shelf folder paths in settings.
- FR41: User can set default sensitivity level for new items.
- FR42: User can toggle light / dark / system theme; persisted.
- FR43: `AGENTS.md` is authoritative documentation, kept current, indexed by product search.
- FR44: `!DOCS/` folder is indexed by product search and returned in relevant results.

### NonFunctional Requirements

**Performance**
- NFR-P1: Ingest end-to-end ≤ 10 s p95 at corpus ≤ 500 items.
- NFR-P2: Search query ≤ 500 ms p95 at corpus ≤ 500 items.
- NFR-P3: Chat first token ≤ 3 s p95.
- NFR-P4: App cold start ≤ 2 s p95 to interactive dashboard.
- NFR-P5: Filesystem change → UI propagation ≤ 2 s p95.
- NFR-P6: Explore graph ≥ 30 fps at 50 nodes, ≥ 20 fps at 200 nodes.
- NFR-P7: Any benchmark regression > 25 % blocks release.
- NFR-P8: Dashboard first meaningful paint ≤ 400 ms p95 when bundle cached.

**Reliability & Data Integrity**
- NFR-R1: No silent data loss on paste / drop failure.
- NFR-R2: All state stored as `.md` + YAML frontmatter on filesystem.
- NFR-R3: Atomic writes (temp-file-plus-rename).
- NFR-R4: Index fully rebuildable from corpus.
- NFR-R5: Plugin failures isolated, logged, item quarantined.
- NFR-R6: Usable at corpus sizes up to 10 000 items.

**Privacy & Security**
- NFR-S1: No inbound network port accessible outside `localhost` by default.
- NFR-S2: No outbound traffic except user-initiated fetches and LLM provider calls.
- NFR-S3: Sensitivity rules enforced at retrieval boundary for both chat panel and MCP surface.
- NFR-S4: Selected LLM provider visible and changeable; cloud-provider usage clearly indicated.
- NFR-S5: No telemetry without explicit opt-in.
- NFR-S6: Secrets kept outside corpus; excluded from search / chat contexts.

**Accessibility**
- NFR-A1: All primary actions keyboard-reachable.
- NFR-A2: Text contrast ≥ 4.5 : 1 in both themes.
- NFR-A3: Icon-only controls labelled; dynamic updates announced via ARIA live regions.
- NFR-A4: `prefers-reduced-motion` honored across all animated surfaces.
- NFR-A5: Zero axe-core / Lighthouse a11y errors on shipped routes.

**Integration**
- NFR-I1: LLM Provider Protocol is sole integration point for any LLM backend.
- NFR-I2: MCP surface wrapped behind adapter; spec changes isolated.
- NFR-I3: Filesystem watcher opaque to sync service; no service-specific code paths.
- NFR-I4: Obsidian compatibility via vault conventions; no Obsidian-specific files written.

**Maintainability & Engineering Quality**
- NFR-Q1: Search-quality regression suite runs on every commit against fixed gold dataset.
- NFR-Q2: Test coverage measured; must not drop between consecutive main-branch commits.
- NFR-Q3: Plugin interface contract documented, typed, independently testable.
- NFR-Q4: `AGENTS.md` kept current; PRs changing extension surface without updating it fail review.
- NFR-Q5: `!DOCS/` folder self-indexing; agent guidance queryable via product search.
- NFR-Q6: Every commit attributable to a story or maintenance ticket.

**Visual Polish & Motion Quality**
- NFR-V1: Every released surface conforms to tokenized design system.
- NFR-V2: Every meaningful state transition has designed animation sustaining 60 fps.
- NFR-V3: External-reviewer "shipped consumer product" judgment is a qualitative release gate.

### Additional Requirements

Technical requirements derived from Architecture decisions (affect implementation sequencing):

- **Monorepo scaffold**: `npm create vite@latest web -- --template react-ts` for frontend; `uv init` + FastAPI + uvicorn + watchdog + pydantic-settings for backend. Folder layout per Architecture § Project Structure.
- **Single SSE event bus**: `/api/events` multiplexed channel with typed discriminated-union envelope (`chat.token`, `chat.citation`, `chat.done`, `ingest.progress`, `ingest.error`, `fs.change`, `fs.conflict`).
- **LLM Provider Protocol**: ABC in `src/latestnews/providers/protocol.py` with `summarize`, `embed`, `chat_complete`, `rerank` operations. Claude + OpenAI adapters shipped in MVP.
- **QMD adapter**: In-process Python package import wrapped in `src/latestnews/search/qmd_adapter.py`. Never subprocess per query.
- **Plugin loader**: `src/latestnews/ingest/plugin_host.py` with asyncio-task isolation, try/except boundary, timeout. Plugins conform to `matches(url) -> bool` + `ingest(url) -> IngestResult` contract from `plugin_api.py`.
- **Filesystem watcher**: `watchdog` Python package behind `src/latestnews/fs/watcher.py`, opaque to sync services.
- **Atomic writes**: Temp-file-plus-rename pattern in `src/latestnews/fs/writer.py`; all markdown I/O goes through this module (enforced architecturally).
- **Conflict detection**: `src/latestnews/fs/conflict_detector.py` spots `*(conflicted copy)*` files and emits SSE `fs.conflict`.
- **Secrets storage**: OS keychain via Python `keyring` (macOS Keychain, Windows Credential Manager, Linux libsecret); `.env` fallback in data root.
- **Settings persistence**: JSON at `${dataRoot}/.latestnews/settings.json`.
- **Logging**: `structlog` → `!DOCS/logs/app.log` rotated daily; plugin errors additionally to `!DOCS/plugin-errors/`; frontend errors → `/api/log` → same stream.
- **CI pipeline**: GitHub Actions matrix — Biome + Ruff lint, tsc + mypy typecheck, Vitest + pytest tests, search regression suite, axe-core accessibility, production build. All required for merge to main.
- **Conventional Commits + PR template** with story ID, AGENTS.md check, CHANGELOG update sections.
- **Error envelope**: `{ error: { code, message, hint?, details? } }` with dotted-namespace machine codes (`ingest.plugin_timeout`, `retrieval.sensitivity_denied`, etc.).
- **Wire format**: `snake_case` JSON end-to-end; no frontend translation layer; `openapi-typescript` generates matching TS types from FastAPI's OpenAPI.
- **MCP surface**: QMD's own MCP server launched as a side-process with app's configured data root; no custom MCP reimplementation.
- **Search regression suite**: `tests/search_quality/` with 10-item gold dataset + 5 fixed queries; advisory mode for MVP, promoted to blocking after first release.
- **Plugin contract tests**: `tests/plugin_contract/` with fixtures per plugin type.
- **Self-indexing `!DOCS/`**: `qmd_adapter.py` scans `!DOCS/` alongside user corpus at boot.

### UX Design Requirements

Actionable design-spec items from UX Design Specification. Each is scope-able to a story.

**Design token system (foundation):**

- **UX-DR1:** Implement `web/src/design/tokens.css` with all semantic color tokens for light + dark themes per Visual Foundation § Color System (accent family navy → neon green, surface / text / border palettes, semantic palette, pre-composed gradient tokens).
- **UX-DR2:** Implement `web/src/design/theme.ts` exposing tokens to Tailwind v4 `@theme` directive; light / dark theme switching via `[data-theme]` selector + `prefers-color-scheme` default + localStorage override.
- **UX-DR3:** Implement `web/src/design/typography.ts` with Inter font (self-hosted via `@fontsource/inter`, weights 400/500/600/700) + JetBrains Mono; complete type scale (display-1/-2, heading-1/-2/-3, body-lg/-/-sm, label, caption, mono, mono-sm).
- **UX-DR4:** Implement `web/src/design/motion.ts` with three-tier durations (fast 120 / base 220 / soft 360 ms), easings (spring, standard, linear), canonical variants (enter, exit, settle, pulse, press, stagger, glow-breathe), and `prefers-reduced-motion` fallback.
- **UX-DR5:** Implement complete spacing scale (4 px base, 0 → 24), radius scale (sm 4 / md 8 / lg 12 / xl 16 / full), shadow scale (subtle / elevated / overlay / glow-accent / glow-accent-subtle) as CSS custom properties.

**shadcn/ui foundation components (install + tokenize):**

- **UX-DR6:** Install and tokenize 17 shadcn/ui foundation components per Component Strategy § Design System Components: Button, Input/Textarea, Dialog, Dropdown menu, Tabs, Tooltip, Popover, Command (cmdk), Toast (Sonner), ScrollArea, Separator, Avatar, Sheet, Skeleton, Switch, Select, Label/Form. Each component's colors / radii / shadows / motion rewritten to consume our tokens; shadcn defaults replaced.

**Custom components (purpose-built for LatestNews):**

- **UX-DR7:** Build `ItemCard` component with default (88 px), compact (56 px), hero (128 px) variants; all states (default, selected, hovered, focused, ingesting, error); full accessibility per UX spec § Custom Components.
- **UX-DR8:** Build `IngestStatusInline` component rendering the 5-state pipeline (queued / fetching / parsing / summarizing / indexed / error) with animated state transitions and `aria-live="polite"`.
- **UX-DR9:** Build `CitationChip` component with neon-marker underline, hover tooltip, deleted state, accessibility per UX spec.
- **UX-DR10:** Build `ShelfChip` component with AI-sparkle indicator and one-click override popover.
- **UX-DR11:** Build `SensitivityBadge` component with three variants (personal / shared / publishable), calm tones, text label always rendered.
- **UX-DR12:** Build `ForceGraphCanvas` (full) + `MiniGraph` (200 px dashboard strip) wrapping `react-force-graph` with token-styled nodes/edges, hover-pulse, shelf filter, reduced-motion fallback, accessible offscreen node list.
- **UX-DR13:** Build `PreSeedBanner` component with `--gradient-hero-space` background, display-2 title, keep/clear actions.
- **UX-DR14:** Build `ConflictResolutionCard` component with side-by-side version view, diff highlighting, three-button resolution (keep mine / keep theirs / keep both), keyboard shortcuts 1/2/3.

**Layout & route implementation (Direction "The Atrium"):**

- **UX-DR15:** Implement Dashboard route three-pane layout (240 px left rail / flex center / 440 px right panel) with capture bar + recent items list + ambient `MiniGraph` strip + toggleable right panel (item-detail ↔ chat-mode).
- **UX-DR16:** Implement Explore route full-viewport force-graph with floating bottom-right controls (shelf filter, zoom, reset) and slide-in node-detail panel.
- **UX-DR17:** Implement Settings route two-column layout (240 px section nav + main content) with sections for Data root & paths, Shared shelves, LLM provider, Sensitivity default, Theme.
- **UX-DR18:** Implement `AppShell` top chrome (48 px, wordmark + route indicator + right-side `?` + theme toggle + Cmd-K affordance chip).
- **UX-DR19:** Implement global keyboard shortcuts: `Cmd-K` (search palette), `Cmd-J` (chat panel toggle), `Cmd-V-anywhere` (capture unless focus is in an input), `?` (keyboard-map overlay), `+`/`-` (thumbs on selected item), `Cmd-1/2/3` (route navigation). Documented in `?` overlay.

**Critical UX flows:**

- **UX-DR20:** Implement first-launch `FirstLaunchHero` + pre-seed pipeline UI — populated dashboard + graph within 60 s, hero banner visible until dismissed, shortcut-hint surfaced after first successful action.
- **UX-DR21:** Implement Cmd-K palette with fuzzy-search-as-you-type, pre-selected top result, inline preview pane, matched-fragment highlighting, footer shortcut hints, palette history (last 10 queries).
- **UX-DR22:** Implement Chat panel with SSE token streaming, `/`-command prompt template picker (compare / similar / what-did-I-think), citation chip appearance, vertical accent-gradient backdrop, send-button `glow-breathe` at idle.
- **UX-DR23:** Implement ambient 5-state ingest visualization on every ItemCard, with stagger animation for multiple items entering list, soft toast confirmation.

**Feedback and empty/loading states:**

- **UX-DR24:** Implement Sonner toast system with tokenized variants (success / warning / error / info), bottom-right stack, auto-dismiss (2 s / 8 s), hover-pause.
- **UX-DR25:** Implement skeleton components (`ItemRowSkeleton`, `GraphSkeleton`) matching generous rhythm; preserve layout to avoid shift.
- **UX-DR26:** Implement all empty-state content per UX spec § Empty and Loading States (8 contexts, each with specific copy + next-action CTA).

**Accessibility & quality gates:**

- **UX-DR27:** Wire axe-core accessibility testing into Playwright e2e suite; CI fails on any a11y error on shipped routes.
- **UX-DR28:** Implement `prefers-reduced-motion` handling across all Motion variants and custom animations; verify ingest-state transitions remain informational without motion.
- **UX-DR29:** Implement focus-visible ring (`--shadow-glow-accent`) on every interactive element; never suppressed; `--gradient-accent-ring` on primary actions.
- **UX-DR30:** Implement `prefers-color-scheme` as first-launch theme default; user override persisted in `localStorage`; instant theme switching (no reload).

### FR Coverage Map

| FR / NFR / UX-DR | Epic(s) | Primary story |
|------------------|---------|----------------|
| FR1–FR7 (Capture & Ingest) | Epic 2, Epic 8 (plugins) | 2.1–2.5, 8.1–8.3 |
| FR8–FR13 (AI Processing) | Epic 3 | 3.1–3.5 |
| FR14–FR19 (Search) | Epic 4 | 4.1–4.5 |
| FR20–FR25 (Chat) | Epic 5 | 5.1–5.5 |
| FR26–FR30 (Explore & Obsidian) | Epic 6 | 6.1–6.3 |
| FR31–FR36 (Shelves / Sensitivity / Multi-user) | Epic 7 | 7.1–7.4 |
| FR37–FR39 (Onboarding) | Epic 9 | 9.1–9.2 |
| FR40–FR44 (Settings & Extensibility) | Epic 8 | 8.4–8.6 |
| All NFRs | Distributed across epics as acceptance criteria | n/a |
| UX-DR1–UX-DR5 (Tokens) | Epic 1 | 1.2–1.3 |
| UX-DR6 (shadcn/ui foundation) | Epic 1 | 1.4 |
| UX-DR7–UX-DR14 (custom components) | Distributed per feature epic | — |
| UX-DR15–UX-DR19 (layout + shortcuts) | Epic 1, Epic 2 | 1.5, 2.1 |
| UX-DR20–UX-DR23 (critical flows) | Epic 9, Epic 4, Epic 5, Epic 2 | — |
| UX-DR24–UX-DR30 (feedback / a11y / polish) | Epic 1 (foundations), distributed later | — |

## Epic List

1. **Epic 1 — Foundation & Design System.** Monorepo scaffold; design tokens; theme; motion system; shadcn/ui install; AppShell + routing; keyboard shortcut registry; CI pipeline baseline. Unblocks every other epic.
2. **Epic 2 — Frictionless Capture.** Capture input + drag-drop; global Cmd-V handler; POST /api/items with atomic stub-write; inline 5-state ingest UI; soft toast system; error / retry state. Delivers Journey 2.
3. **Epic 3 — AI Content Processing Pipeline.** LLM Provider Protocol + Claude + OpenAI adapters; runtime provider switching UI; async summarize / relate / shelf-suggest pipeline; user override UI for AI fields. Delivers FR8–FR13.
4. **Epic 4 — Rediscovery Search.** QMD adapter; search endpoint with hybrid ranking; Cmd-K command palette; thumbs feedback + rerank boost; shelf filter; search regression suite. Delivers Journey 3.
5. **Epic 5 — Chat with Your Wiki.** SSE event bus + /api/events; chat endpoint with orchestrator; in-dashboard chat panel; streaming tokens; citation chips; `/`-command templates; sensitivity middleware; optional MCP surface via QMD launcher. Delivers Journey 4.
6. **Epic 6 — Explore & Obsidian Compatibility.** Explore route; MiniGraph on dashboard; node hover / click / drag; shelf filter; Obsidian vault compatibility verified. Delivers FR26–FR30 and Journey 1's graph component.
7. **Epic 7 — Shelves, Sensitivity & Multi-User.** Shelf model; item move / delete; sensitivity badge + picker; sensitivity middleware (single implementation); shared shelf path config; filesystem watcher + conflict resolution. Delivers Journey 5.
8. **Epic 8 — Settings & Plugin Extensibility.** Settings route; data-root / shared-shelf path config; default sensitivity / theme / LLM provider; plugin loader + contract tests; `AGENTS.md` operative; self-indexing `!DOCS/`. Delivers FR40–FR44 and Journey 6 (developer-facing).
9. **Epic 9 — Onboarding, Polish & Release.** First-launch pre-seed pipeline; FirstLaunchHero banner; shortcut-hint after first action; animation polish pass; accessibility audit; visual-quality external review (NFR-V3); release gating.

**Build order.** Epics 1 → 2/7 partial (foundational filesystem + capture) → 3 → 4 → 5 → 6 → 7 completion → 8 → 9. This maps approximately to the brainstorming's 5-day plan (Day 1 = Epic 1; Day 2 = Epic 2 + 7 partial; Day 3 = Epic 3 + 9 partial; Day 4 = Epic 4 + 5; Day 5 = Epic 6 + 7 completion + 8 + 9 polish).

---

## Epic 1: Foundation & Design System

Establish the monorepo scaffold, design token system, typography, motion, shadcn/ui foundation components, app shell with routing and theme, and CI pipeline. Unblocks every subsequent epic. Deliverable per story is user-visible incrementally (a launchable dashboard shell by the end of this epic).

### Story 1.1: Bootstrap the monorepo scaffold

As a developer,
I want the project scaffold checked in and runnable,
So that every subsequent feature has a working foundation to build upon.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `npm install` at repo root and `uv sync` in the Python backend
**Then** all dependencies install without error
**And** `web/` contains a Vite React TypeScript scaffold (from `npm create vite@latest web -- --template react-ts`)
**And** `src/latestnews/` contains `app.py`, `__main__.py`, and an empty FastAPI app factory returning 200 on `/api/health`

**Given** the scaffold is installed
**When** I run `npm run dev` at repo root
**Then** `concurrently` launches backend on port 8000 and frontend on port 5173
**And** opening `http://localhost:5173` displays the Vite React placeholder page
**And** Vite proxies `/api/*` requests to `http://localhost:8000`

**Given** the project root
**When** I inspect the file tree
**Then** `biome.json`, `pyproject.toml`, `package.json`, `uv.lock`, `.python-version`, `.env.example`, `.gitignore`, `AGENTS.md` (stub), `README.md` (stub), `LICENSE`, and `.editorconfig` all exist at root
**And** `.github/workflows/ci.yml` contains a placeholder workflow that runs lint + typecheck + test commands (initially no-op passes)

### Story 1.2: Implement design tokens (colours, spacing, radius, shadow)

As a developer,
I want the complete design-token system exported as CSS custom properties,
So that every UI component can consume tokens and light/dark themes work at parity.

**Acceptance Criteria:**

**Given** the project scaffold exists
**When** I inspect `web/src/design/tokens.css`
**Then** the file defines all semantic colour tokens under `[data-theme='light']` and `[data-theme='dark']` selectors
**And** every token from UX Design Spec § Color System is present (surface, text, border, accent family including neon green `--color-accent-glow`, semantic)
**And** pre-composed gradient tokens (`--gradient-accent-diagonal`, `--gradient-accent-vertical`, `--gradient-accent-ring`, `--gradient-hero-space`, `--gradient-node-glow`, `--gradient-citation-highlight`) are defined

**Given** the tokens file exists
**When** I inspect `web/src/design/theme.ts` and `web/tailwind.config.js` (or Tailwind v4 `@theme` in a CSS import)
**Then** Tailwind's `@theme` layer consumes the CSS custom properties
**And** utility classes like `bg-surface-primary`, `text-accent-glow`, `shadow-glow-accent` resolve to token values

**Given** the spacing, radius, and shadow scales are defined
**When** I apply `--space-4` anywhere
**Then** it resolves to `16px`
**And** `--radius-md` resolves to `8px`
**And** `--shadow-glow-accent` casts a dual-layer neon halo matching the UX spec

### Story 1.3: Implement typography system (Inter + JetBrains Mono)

As a developer,
I want Inter and JetBrains Mono self-hosted with the full type scale,
So that every text element uses tokenized typography.

**Acceptance Criteria:**

**Given** the typography system is implemented
**When** I inspect `web/src/design/typography.ts` and `web/src/design/tokens.css`
**Then** Inter is loaded via `@fontsource/inter` at weights 400, 500, 600, 700
**And** JetBrains Mono is loaded for mono tokens
**And** the complete type scale (`display-1`, `display-2`, `heading-1..3`, `body-lg`, `body`, `body-sm`, `label`, `caption`, `mono`, `mono-sm`) is defined as paired `--font-size-*` / `--line-height-*` tokens with letter-spacing where specified

**Given** the type scale exists
**When** any component applies a Tailwind class like `text-body` or `text-display-1`
**Then** the rendered text uses the correct font family, size, line-height, weight, and letter-spacing
**And** Inter glyphs render with OpenType features enabled (ss01 or equivalent if specified)

### Story 1.4: Install and tokenize shadcn/ui foundation components

As a developer,
I want the 17 shadcn/ui foundation components installed, tokenized, and ready to compose,
So that every feature epic has consistent, accessible UI primitives available.

**Acceptance Criteria:**

**Given** the design token system is in place
**When** the shadcn CLI is configured and run for each required component
**Then** `web/src/components/ui/` contains Button, Input, Textarea, Dialog, Dropdown menu, Tabs, Tooltip, Popover, Command, Toast (Sonner), ScrollArea, Separator, Avatar, Sheet, Skeleton, Switch, Select, Label, Form
**And** `web/components.json` records the configuration

**Given** the components are installed
**When** I inspect each component's source
**Then** all `bg-*`, `text-*`, `border-*` classes use our semantic tokens (not shadcn defaults)
**And** radii use `--radius-md` as default
**And** focus rings use `--shadow-glow-accent`
**And** motion uses Motion variants from `web/src/design/motion.ts` rather than raw CSS transitions

**Given** the Button component
**When** I render `<Button variant="primary">Click</Button>`
**Then** its background is `--gradient-accent-diagonal`
**And** its text is `--color-text-inverted`
**And** hovering intensifies the `--shadow-glow-accent` halo
**And** pressing applies the `press` Motion variant (scale 0.96)

### Story 1.5: Implement AppShell with routing, theme toggle, and keyboard overlay

As a user,
I want a consistent app shell with top chrome, route navigation, theme toggle, and keyboard-shortcut help,
So that I can orient myself and find every primary action from anywhere in the app.

**Acceptance Criteria:**

**Given** the design system is in place
**When** I open `http://localhost:5173`
**Then** the AppShell renders with 48 px top chrome (wordmark + route indicator on left; `?` hint · theme toggle · Cmd-K affordance chip on right)
**And** React Router v7 is configured with routes `/` (Dashboard), `/explore`, `/settings`, each a placeholder

**Given** I am on any route
**When** I press `Cmd-1` / `Cmd-2` / `Cmd-3`
**Then** I navigate to Dashboard / Explore / Settings respectively
**And** the top-chrome route indicator updates with a 220 ms cross-fade

**Given** I am on any route
**When** I press `?`
**Then** a keyboard-shortcut overlay appears listing every global shortcut with its effect
**And** pressing `Esc` or `?` again dismisses the overlay

**Given** the theme toggle is in top chrome
**When** the user has never set a preference
**Then** the initial theme follows `prefers-color-scheme`

**When** I click the theme toggle
**Then** the theme switches instantly without reload
**And** the choice is persisted in `localStorage`
**And** every subsequent page load respects the persisted choice

---

## Epic 2: Frictionless Capture

Deliver the complete capture flow — paste and drag-drop capture, backend ingest with atomic stub write, global Cmd-V handler, inline 5-state ingest visualization, and error / retry UI. After this epic, a user can paste any URL or file and see it land in the Recent list with visible progress. Journey 2 of the PRD fully delivered.

### Story 2.1: Dashboard capture input + drag-drop zone

As a user,
I want a prominent capture input at the top of the Dashboard with drag-drop support,
So that I can paste URLs or drop files without any setup or decision.

**Acceptance Criteria:**

**Given** I am on the Dashboard route
**When** the page loads
**Then** a generous capture input bar is visible at the top of the center pane with placeholder "Paste a link, drop a file, or Cmd-V from anywhere"
**And** the input is auto-focused
**And** the input has a subtle radial-gradient accent halo emanating from behind it (per Direction B)

**Given** the input is focused
**When** I paste a URL and press Enter (or click the send affordance)
**Then** `POST /api/items` is called with the URL
**And** the send affordance has a `glow-breathe` ambient animation when idle

**Given** I am anywhere on the Dashboard except inside an input
**When** I drag a file onto the page
**Then** a full-dashboard drop zone appears with "Drop to capture" label
**And** releasing the file triggers `POST /api/items` with multipart form data containing the file

### Story 2.2: Backend ingest endpoint with atomic stub write

As a user,
I want every paste to be durable the moment it lands,
So that I never lose a capture to a browser crash or network blip.

**Acceptance Criteria:**

**Given** the backend is running
**When** `POST /api/items` receives a URL or file blob
**Then** the coordinator writes a stub `.md` file atomically (temp-file-plus-rename) to the data root before returning
**And** the response returns within 100 ms with `201 Created` and the item's UUID v7 id

**Given** the stub `.md` file exists
**When** I inspect its frontmatter
**Then** fields `id`, `schema_version`, `source`, `source_type`, `sensitivity: personal`, `created_at`, `title: <fallback>` are all present
**And** the body section is empty (placeholder `---`)

**Given** the stub is written
**When** the ingest coordinator enqueues an enrichment task
**Then** `SSE /api/events` emits `ingest.progress` with `state: queued` and the item id
**And** the enrichment task runs asynchronously without blocking the HTTP response

### Story 2.3: Global Cmd-V paste handler with focus discrimination

As a user,
I want to capture by pressing Cmd-V from anywhere in the app, except when I'm typing in an input,
So that capture is always one keystroke away.

**Acceptance Criteria:**

**Given** I am on any route and no input/textarea/contenteditable has focus
**When** I press Cmd-V
**Then** the clipboard content is sent to `POST /api/items`
**And** a ghost "Captured" toast appears at bottom-right

**Given** focus is inside a chat input, search box, or any form field
**When** I press Cmd-V
**Then** the paste performs a normal text paste into the focused field
**And** no capture is triggered

**Given** the clipboard contains text that is not a URL and not markdown-like
**When** the global Cmd-V captures it
**Then** the item is ingested as a plain markdown item with the pasted text as body content

### Story 2.4: Inline 5-state ingest visualization on ItemCard

As a user,
I want each captured item to show its processing state inline on its row,
So that I know progress is happening without a modal or spinner demanding my attention.

**Acceptance Criteria:**

**Given** an item has been captured
**When** it appears in the Recent list
**Then** the `IngestStatusInline` pill is visible showing current state (queued / fetching / parsing / summarizing / indexed)
**And** state transitions play a 220 ms cross-fade
**And** elapsed time counts up in mono-sm text next to the state

**Given** the user has `prefers-reduced-motion: reduce`
**When** states transition
**Then** state labels swap instantly without animation
**And** the elapsed time display is preserved

**Given** the item reaches `indexed` state
**When** 2 seconds pass
**Then** the `IngestStatusInline` pill fades out
**And** the ItemCard transitions to show TL;DR, shelf chip, related-items chip, and AI sparkle indicator

### Story 2.5: Error state, retry action, and soft toast system

As a user,
I want failed captures to be visible and retryable, not silently dropped,
So that I trust the system with my paste-and-forget behaviour.

**Acceptance Criteria:**

**Given** an ingest fails (paywalled URL, 404, plugin timeout)
**When** the SSE emits `ingest.error`
**Then** the ItemCard shows a muted "Couldn't fetch" label replacing the TL;DR line
**And** a Retry button appears inline on the card
**And** the original source URL is preserved in the item's frontmatter
**And** the ItemCard remains in the Recent list (not silently removed)

**Given** I click Retry on an errored item
**When** the retry runs
**Then** the ItemCard returns to `queued` state and the pipeline restarts
**And** the previous error is cleared

**Given** three captures succeed within 5 seconds
**When** the Sonner toast system renders notifications
**Then** toasts stack at bottom-right (max 3 visible)
**And** each success toast auto-dismisses after 2 s
**And** hovering any toast pauses its dismiss timer

**Given** a toast is an error or warning
**When** it renders
**Then** it auto-dismisses after 8 s instead of 2 s
**And** its colour uses `--color-warning-subtle-bg` or `--color-error-subtle-bg`

---

## Epic 3: AI Content Processing Pipeline

Implement the LLM Provider Protocol, ship Claude and OpenAI adapters, run the async enrichment pipeline (TL;DR + related + shelf suggestion), and provide user override UI for every AI-generated field. After this epic, items pasted in Epic 2 gain their TL;DR, suggested shelf, and related items. FR8–FR13 covered.

### Story 3.1: LLM Provider Protocol + Claude adapter

As a developer,
I want an abstract LLM Provider Protocol with a working Claude adapter,
So that every AI call is isolated behind a single interface and easily swappable.

**Acceptance Criteria:**

**Given** the backend is structured per architecture
**When** I inspect `src/latestnews/providers/protocol.py`
**Then** the `LLMProvider` ABC defines async methods `summarize(content: str) -> str`, `embed(content: str) -> list[float]`, `chat_complete(messages, tools=None) -> AsyncIterator[ChatToken]`, `rerank(query, candidates) -> list[Scored]`

**Given** the protocol is defined
**When** I inspect `src/latestnews/providers/claude.py`
**Then** a `ClaudeProvider(LLMProvider)` class implements all four methods using the Anthropic SDK
**And** the API key is read via `src/latestnews/settings/secrets.py` (OS keychain via `keyring`, fallback to `.env`)
**And** unit tests in `tests/backend/providers/test_claude.py` verify each method with recorded fixtures (not live API)

### Story 3.2: OpenAI adapter

As a developer,
I want an OpenAI adapter conforming to the Provider Protocol,
So that users can choose between Claude and OpenAI for all AI operations.

**Acceptance Criteria:**

**Given** the Provider Protocol is defined
**When** I inspect `src/latestnews/providers/openai.py`
**Then** an `OpenAIProvider(LLMProvider)` class implements all four methods using the OpenAI Python SDK
**And** model names (summarize vs. chat) are configurable via settings
**And** unit tests in `tests/backend/providers/test_openai.py` pass with recorded fixtures

**Given** both adapters exist
**When** `src/latestnews/providers/registry.py` discovers adapters
**Then** both `claude` and `openai` are listed as available providers
**And** `selector.py` returns the currently configured provider based on settings

### Story 3.3: AI processing pipeline (TL;DR + related + shelf)

As a user,
I want each captured item automatically enriched with a summary, related items, and a suggested shelf,
So that my corpus becomes searchable and organized without any manual effort.

**Acceptance Criteria:**

**Given** an item transitions to `parsing` state and has body content
**When** the processor pipeline runs
**Then** `summarize()` produces a 1–3 sentence TL;DR and writes it to frontmatter
**And** `rerank()` or a semantic similarity query via QMD produces up to 3 related-item IDs
**And** a shelf suggestion is produced by the current provider and applied to the item's `shelf` field

**Given** the user has no shelves yet
**When** the pipeline runs
**Then** the suggested shelf defaults to `inbox` and an AI-sparkle indicator tags the shelf chip

**Given** any step in the pipeline fails (LLM timeout, provider error)
**When** the failure is caught
**Then** the item is still indexed without the failed field
**And** a "summary pending" chip replaces the TL;DR on the ItemCard
**And** the failure is logged to `!DOCS/logs/app.log` with correlation ID

### Story 3.4: User override UI for AI-generated fields

As a user,
I want to override any AI-generated TL;DR, shelf, or related item with one click,
So that I am always the final authority on my corpus.

**Acceptance Criteria:**

**Given** an item has an AI-generated TL;DR
**When** I hover the TL;DR in the item detail panel
**Then** an "Edit" affordance appears next to it
**And** clicking Edit replaces the text with an inline textarea pre-populated with the current TL;DR
**And** pressing Esc cancels; pressing Cmd-Enter or clicking Save persists the edit to frontmatter

**Given** an item has an AI-suggested shelf
**When** I click the shelf chip on the ItemCard
**Then** a popover opens with options "Keep suggestion", "Move to…" (shelf picker), "Remove suggestion"
**And** choosing any option persists to frontmatter and updates the UI within 500 ms

**Given** an item has a "Regenerate" action for TL;DR
**When** I click it
**Then** the pipeline re-runs summarize only
**And** the card shows a brief `summarizing` state during regeneration

### Story 3.5: Settings UI for LLM provider switching

As a user,
I want to pick my LLM provider and see which one is active at all times,
So that I know where my content is being sent for processing.

**Acceptance Criteria:**

**Given** the Settings route exists (from Epic 1)
**When** I navigate to Settings → LLM provider section
**Then** a `Select` component shows available providers (Claude, OpenAI) with the current choice highlighted
**And** an API key input field is shown for the chosen provider
**And** clicking Save persists the key to the OS keychain via `keyring`

**Given** I switch providers in Settings
**When** the save completes
**Then** the change takes effect immediately without app restart
**And** a toast confirms the switch
**And** the top-chrome area displays a muted badge indicating the active cloud provider (e.g. "Claude")

**Given** no provider is configured
**When** I attempt to trigger any AI operation (ingest summarize, chat send)
**Then** an inline prompt card appears in the failing surface: "Add a provider key in Settings to enable AI processing"
**And** the app remains functional for non-AI operations (search, Explore, shelves, sensitivity)

---

## Epic 4: Rediscovery Search

Implement QMD integration, hybrid search endpoint, Cmd-K command palette with preview pane, shelf filter, and thumbs-feedback-to-rerank loop. After this epic, Journey 3 (the rediscovery moment) fully works. FR14–FR19 covered plus the search-quality regression suite.

### Story 4.1: QMD adapter with in-process integration

As a developer,
I want QMD integrated in-process behind an adapter,
So that search latency stays under 500 ms and QMD upgrades are a one-file edit.

**Acceptance Criteria:**

**Given** the backend is running
**When** I inspect `src/latestnews/search/qmd_adapter.py`
**Then** QMD is imported as a Python package (not subprocess)
**And** the adapter exposes `index_file(path)`, `reindex()`, `search(query, filters, top_k) -> list[Result]`, and `related_items(item_id, top_k)` methods
**And** the adapter manages QMD's index under `${dataRoot}/.latestnews/index/`

**Given** the adapter is in place
**When** I start the backend
**Then** the adapter indexes the data root on boot if the index is missing or the corpus has changed
**And** `!DOCS/` is indexed alongside the user corpus (self-indexing)

**Given** a search regression suite exists at `tests/search_quality/`
**When** CI runs
**Then** the 10-item gold dataset is indexed and 5 fixed queries execute
**And** the test passes if ≥ 4 of 5 queries return the expected top-3 item
**And** CI reports the result as advisory (non-blocking) for MVP, promotable to blocking later

### Story 4.2: Search endpoint with hybrid ranking and shelf filter

As a user,
I want a search endpoint that returns ranked results for my corpus with optional shelf filtering,
So that my dashboard and command palette can display results instantly.

**Acceptance Criteria:**

**Given** the QMD adapter is indexed
**When** `GET /api/search?q=<query>&shelf=<shelf_id>&limit=10` is called
**Then** the response returns up to 10 ranked results within 500 ms p95 at corpus ≤ 500 items
**And** each result contains `id`, `title`, `source`, `shelf`, `created_at`, `excerpt`, `matched_fragment`, `score`
**And** if `shelf` query param is present, only items from that shelf are returned

**Given** the search applies sensitivity middleware
**When** the query context indicates `shared` or `public`
**Then** items with `sensitivity: personal` are excluded from results
**And** the exclusion is silent (no count delta exposed to the client)

**Given** a result includes a rating
**When** the ranker scores it
**Then** thumbs-up items receive a boost and thumbs-down items receive a decay on the final score

### Story 4.3: Cmd-K command palette with preview pane

As a user,
I want to press Cmd-K from anywhere and fuzzy-search my corpus with a live preview,
So that I can rediscover what I saved in under 3 seconds.

**Acceptance Criteria:**

**Given** I am on any route
**When** I press Cmd-K
**Then** the command palette opens with a 120 ms fade + scale animation, input auto-focused, dashboard dimmed behind
**And** the palette occupies the centre of the viewport with `--shadow-overlay` elevation

**Given** the palette is open
**When** I type a query
**Then** `GET /api/search` fires on each keystroke with a 50 ms debounce
**And** results render within 300 ms with the top result pre-selected
**And** the right preview pane shows the selected result's TL;DR, source, shelf, date, and matched-fragment excerpt with `--color-accent-subtle-bg` highlighting

**Given** results are visible
**When** I press Arrow Down / Up
**Then** selection shifts and the preview pane updates

**When** I press Enter
**Then** the palette closes with an exit animation and the selected item opens in the Dashboard's right detail panel

**When** I press Cmd-Enter
**Then** the selected item opens in its dedicated full-route view

**When** I press Esc or the query has zero results and I press `/`
**Then** Esc closes the palette; `/` forwards the query into a new chat turn via Cmd-J (see Epic 5)

**Given** the palette has been used
**When** I open it again with an empty input and press Arrow Up
**Then** the last 10 queries are listed as recent searches, navigable

### Story 4.4: Thumbs-up / thumbs-down feedback with rerank boost

As a user,
I want to quickly rate items so the system learns what I care about,
So that future searches put the right items on top.

**Acceptance Criteria:**

**Given** I have an item selected (in Dashboard detail or palette preview)
**When** I press `+` or click the thumbs-up affordance
**Then** the item's frontmatter `rating` field is set to `1`
**And** the button plays a `press` + `pulse` Motion animation (spring scale 1 → 1.03 → 1)
**And** the rating is optimistically applied to search ranking immediately (no server round-trip required to feel applied)

**Given** I have already given thumbs-up
**When** I press `-` or click thumbs-down
**Then** the rating flips to `-1`
**And** the thumbs-up visual returns to default

**Given** I press `+` or `-` twice
**When** the second press fires
**Then** the rating clears (returns to unrated)
**And** the button returns to default state

**Given** the rating is persisted
**When** a subsequent search includes related-topic items
**Then** thumbs-up items rank higher than unrated items for similar queries
**And** the search-regression suite includes at least one test that asserts rating influences rank order

---

## Epic 5: Chat with Your Wiki

Build the SSE event bus, chat orchestrator, in-dashboard chat panel with streaming and citations, `/`-command prompt templates, sensitivity middleware (single-implementation), and the optional MCP surface via QMD's own launcher. Journey 4 (both in-dashboard and power-user variants) delivered. FR20–FR25 covered.

### Story 5.1: SSE event bus with typed envelope

As a developer,
I want a single multiplexed SSE endpoint carrying typed events,
So that the frontend subscribes once and receives every async update.

**Acceptance Criteria:**

**Given** the backend is running
**When** the frontend opens `GET /api/events` (SSE)
**Then** the connection stays open and receives events with `{ type, payload, meta }` JSON envelopes
**And** the event types include `chat.token`, `chat.citation`, `chat.done`, `ingest.progress`, `ingest.error`, `fs.change`, `fs.conflict`
**And** types are defined in both `src/latestnews/events/types.py` (Python enum + Pydantic payload models) and `web/src/types/api.generated.ts` (TypeScript discriminated union)

**Given** the connection drops
**When** the frontend `useSSE` hook reconnects
**Then** exponential backoff is applied (capped at 30 s)
**And** the backend replays no events (client re-subscribes to new events only; history is not replayed)

**Given** the frontend subscribes
**When** an event arrives
**Then** the `useSSE` hook dispatches it to the relevant feature's Zustand store via typed handlers
**And** no component consumes SSE events directly

### Story 5.2: Chat orchestrator + streaming endpoint

As a user,
I want to ask questions of my corpus and receive streamed answers with citations,
So that rediscovery through conversation feels immediate.

**Acceptance Criteria:**

**Given** the chat endpoint exists
**When** `POST /api/chat` receives `{ message, context }`
**Then** the orchestrator retrieves top-k relevant items via `qmd_adapter.search` with sensitivity middleware applied
**And** calls the current provider's `chat_complete` with the items as context
**And** streams tokens via SSE `chat.token` events

**Given** the response completes
**When** synthesis finishes
**Then** SSE emits `chat.citation` events with each cited item's id, title, source
**And** a final `chat.done` event with total token count and latency

**Given** the first token latency target
**When** the request is issued
**Then** the first token arrives within 3 seconds p95

**Given** the LLM provider is unreachable
**When** the chat request times out after one retry
**Then** an SSE `chat.done` fires with an error payload
**And** the chat UI surfaces "Chat unavailable — try search for exact-text retrieval" inline

### Story 5.3: Dashboard chat panel with citation chips

As a user,
I want a chat panel in my dashboard's right pane that streams responses and renders clickable citations,
So that I can have a conversation with my corpus without leaving the dashboard.

**Acceptance Criteria:**

**Given** I am on the Dashboard route
**When** I press Cmd-J
**Then** the right 440 px panel toggles to chat mode
**And** previous item-detail content fades out (220 ms); chat UI fades in with `--gradient-accent-vertical` backdrop
**And** a neon `--shadow-glow-accent` ring briefly pulses on the mode indicator

**Given** chat mode is open
**When** I type a question and press Enter
**Then** my message appears as a user bubble
**And** the assistant bubble renders with a typing-indicator (three gentle-pulse dots) until the first token arrives
**And** tokens then fade in sequentially as `chat.token` SSE events stream

**Given** the response completes
**When** `chat.citation` events arrive
**Then** citation chips render at the end of the assistant bubble
**And** each citation shows the source item's title with `--gradient-citation-highlight` underline marker
**And** hovering a citation opens a tooltip with TL;DR + source + date

**Given** I click a citation chip
**When** the chip activates
**Then** the source item opens in the Dashboard's detail pane (replacing chat mode)
**And** the chat thread history remains intact when I re-open chat mode

**Given** I press Esc or Cmd-J again
**When** chat mode is open
**Then** the panel closes and reverts to item-detail (if an item is selected) or the chat-trigger card (if nothing selected)

### Story 5.4: `/`-command prompt template picker

As a user,
I want to insert a starter prompt template with `/`,
So that I can launch compare / similar / what-did-I-think queries without remembering phrasing.

**Acceptance Criteria:**

**Given** chat mode is open and input is focused
**When** I type `/` as the first character
**Then** an inline overlay appears above the input listing available templates: `/compare`, `/similar`, `/what-did-I-think`

**Given** the template picker is open
**When** I arrow down/up and press Enter
**Then** the chosen template text is inserted into the input with placeholder text for any arguments
**And** my cursor is positioned at the first placeholder

**Given** a template is inserted
**When** I complete the placeholders and press Enter
**Then** the full formatted message is sent to `/api/chat` like a normal message

### Story 5.5: Sensitivity middleware + optional MCP surface

As a user,
I want sensitivity rules enforced across chat, search, and the optional MCP surface uniformly,
So that my personal items never leak through a shared context.

**Acceptance Criteria:**

**Given** the sensitivity middleware exists at `src/latestnews/search/sensitivity_middleware.py`
**When** any retrieval call passes through it with a context tagged `shared` or `public`
**Then** items with `sensitivity: personal` are filtered from the results
**And** the filter is invoked identically from `search.py`, `chat/orchestrator.py`, and the MCP surface

**Given** the QMD MCP side-process is configured
**When** the app starts with `mcp.enabled: true` in settings
**Then** `src/latestnews/mcp/qmd_launcher.py` spawns QMD's MCP server as a subprocess pointed at the user's data root
**And** the MCP server exposes search + item retrieval tools that an external MCP client (Claude Desktop, Cursor) can invoke
**And** the MCP server enforces the same sensitivity middleware via a shared retrieval function

**Given** the MCP surface is enabled
**When** an external client connects with a `public` context profile
**Then** `personal`-sensitivity items are never returned in responses
**And** the exclusion leaves no trace in the response (no count, no "filtered" flag)

---

## Epic 6: Explore & Obsidian Compatibility

Deliver the Explore page with full-viewport force graph, the dashboard MiniGraph ambient strip, shelf filter, hover/drag interactions, and Obsidian vault compatibility verification. FR26–FR30 covered.

### Story 6.1: Explore page with force-directed graph

As a user,
I want a dedicated Explore page that visualizes my corpus as a force-directed topic graph,
So that I can navigate by relationships rather than lists.

**Acceptance Criteria:**

**Given** I have at least 10 items in my corpus
**When** I navigate to `/explore`
**Then** `react-force-graph` renders in WebGL mode within `web/src/features/explore/ForceGraph.tsx`
**And** nodes are sized by connection count and coloured with `--gradient-node-glow` tinted by shelf
**And** edges are 1 px `--color-border-default` at rest
**And** the graph sustains ≥ 30 fps at 50 nodes on baseline hardware

**Given** I hover a node
**When** related nodes exist
**Then** related nodes pulse with a neon-glow animation
**And** connecting edges highlight with `--color-accent-mid`

**Given** floating controls are present bottom-right
**When** I click the shelf filter
**Then** a popover opens listing shelves; selecting one dims non-matching nodes to 20 % opacity
**And** selecting "All" clears the filter

**When** I click zoom controls or reset-view
**Then** the graph adjusts accordingly with a soft 360 ms transition

**Given** the user has `prefers-reduced-motion: reduce`
**When** the graph loads
**Then** nodes appear at pre-computed positions without force simulation
**And** hover-pulse is replaced with instant state change

### Story 6.2: MiniGraph ambient strip on Dashboard

As a user,
I want a compact graph strip always visible on my Dashboard,
So that I encounter my graph structure passively without navigating.

**Acceptance Criteria:**

**Given** I am on the Dashboard route
**When** the page loads
**Then** a 200 px-tall `MiniGraph` strip appears at the bottom of the center pane
**And** it renders a condensed view of the current shelf filter (or the whole corpus if no filter)

**Given** the MiniGraph is visible
**When** I hover a node
**Then** it pulses in sync with the full Explore page behaviour (shared motion tokens)

**When** I click a node
**Then** the item opens in the right detail panel without navigating away from Dashboard

**When** I click the expand affordance (top-right of the MiniGraph)
**Then** I navigate to `/explore` with the same shelf filter preserved

### Story 6.3: Obsidian vault compatibility verified

As a user,
I want my data root to open directly in Obsidian as a valid vault,
So that I am not locked into LatestNews.

**Acceptance Criteria:**

**Given** the user's data root contains items created by LatestNews
**When** they point Obsidian at that folder
**Then** Obsidian opens it as a valid vault without any migration or setup step
**And** all `.md` files appear in Obsidian's file explorer
**And** Obsidian's built-in graph view renders the corpus
**And** `[[wiki-link]]` syntax inside items (if any) is recognized by Obsidian

**Given** an automated integration test runs in CI
**When** `tests/backend/fs/test_obsidian_compatibility.py` executes
**Then** it asserts that the LatestNews-written markdown files pass Obsidian vault validation (standard frontmatter, no unexpected metadata files, folder structure compatible)

---

## Epic 7: Shelves, Sensitivity & Multi-User

Deliver shelf model with move/delete, sensitivity badge with picker and middleware (single-implementation referenced by Epic 4 and 5), shared shelf path configuration, filesystem watcher, and conflict-resolution UI. Journey 5 delivered. FR31–FR36 covered.

### Story 7.1: Shelf model with item move and delete

As a user,
I want to organize items into shelves and move/delete items,
So that my corpus remains under my control even as AI organizes on my behalf.

**Acceptance Criteria:**

**Given** the left rail on Dashboard
**When** the app loads
**Then** shelves are rendered as subfolders under the data root
**And** each shelf shows its item count
**And** an `Inbox` pseudo-shelf shows items without an explicit shelf

**Given** I have an item open in the detail panel
**When** I click the shelf chip and choose "Move to…" → a different shelf
**Then** the `.md` file is moved atomically (temp-file-plus-rename then remove-source) to the target shelf's subfolder
**And** the ItemCard's shelf chip updates
**And** the QMD index reflects the move within 2 seconds

**Given** I have an item selected
**When** I click a "Delete" affordance
**Then** a Dialog confirms "Delete this item? It cannot be recovered."
**And** on confirm, the `.md` file is removed and the QMD index updated
**And** a soft toast confirms the deletion

### Story 7.2: Sensitivity badge, picker, and single-implementation middleware

As a user,
I want every item to visibly carry a sensitivity label (personal / shared / publishable) and to change it in one click,
So that I know what will and will not be exposed through chat or the MCP surface.

**Acceptance Criteria:**

**Given** every ItemCard and item detail view
**When** an item is rendered
**Then** the `SensitivityBadge` component is visible with icon + text label in calm tokens
**And** `personal` uses lock icon + muted surface; `shared` uses users icon + accent-subtle-bg; `publishable` uses globe icon + surface-secondary

**Given** I click the SensitivityBadge on any item
**When** the popover opens
**Then** I can choose `personal` / `shared` / `publishable`
**And** the choice persists to frontmatter instantly
**And** a soft toast confirms the change (2 s auto-dismiss)

**Given** the sensitivity middleware is invoked by search and chat
**When** it is imported in both `src/latestnews/search/__init__.py` and `src/latestnews/chat/orchestrator.py`
**Then** it comes from the same module `src/latestnews/search/sensitivity_middleware.py`
**And** no duplicate filtering logic exists elsewhere
**And** a unit test in `tests/backend/search/test_sensitivity_middleware.py` verifies context-driven filtering (`personal` retained for `personal` context; filtered for `shared`/`public`)

### Story 7.3: Shared shelf paths + filesystem watcher

As a user,
I want to configure additional folder paths as shared shelves that watch for external changes,
So that my partner's pastes appear in my app without any manual sync.

**Acceptance Criteria:**

**Given** I navigate to Settings → Shared shelves section
**When** I paste a folder path and click Add
**Then** the path is validated (exists + readable); if invalid an inline error appears
**And** on success the path is persisted in settings and the shelf appears in the left rail with a "shared" badge

**Given** a shared shelf is configured
**When** the `watchdog`-based filesystem watcher detects a file change in that folder
**Then** SSE emits `fs.change` with the affected path
**And** the frontend refreshes the shelf's item list within 2 seconds
**And** the QMD index updates to reflect the change

**Given** a new `.md` file arrives in a shared shelf with an `author` frontmatter field
**When** the ItemCard renders
**Then** the card shows "from {author}" attribution in the metadata line
**And** if `author` is missing, no attribution is shown (falls back to filename-based identity silently)

### Story 7.4: Conflict detection and resolution UI

As a user,
I want one-click resolution of filesystem conflicts when my sync service creates a conflict artefact,
So that shared shelves never feel unsafe.

**Acceptance Criteria:**

**Given** `src/latestnews/fs/conflict_detector.py` is watching shared shelves
**When** a file matching `*(conflicted copy)*.md` (iCloud / Dropbox pattern) appears
**Then** SSE emits `fs.conflict` with both file paths
**And** the affected ItemCard shows an inline `ConflictResolutionCard`

**Given** the ConflictResolutionCard is visible
**When** it renders
**Then** it shows "Two versions of this item found" in a muted warning tone
**And** side-by-side columns display both version's frontmatter / key content with timestamps and diff highlighting
**And** three buttons are visible: "Keep mine", "Keep theirs", "Keep both"
**And** keyboard shortcuts 1 / 2 / 3 trigger the respective actions (documented in tooltips)

**Given** I click "Keep mine"
**When** the resolution processes
**Then** the conflict file is moved to `!DOCS/archive/`
**And** the canonical file remains in place
**And** a toast confirms; the card dismisses

**Given** I click "Keep both"
**When** the resolution processes
**Then** the conflict file is renamed to `<original-title>-alt.md` in the same shelf
**And** both items remain searchable
**And** the card dismisses

---

## Epic 8: Settings & Plugin Extensibility

Implement the plugin loader with isolation and contract tests, ship the five built-in ingest plugins, deliver the Settings route with all configuration sections, make `AGENTS.md` operative, and wire `!DOCS/` self-indexing. Journey 6 (developer-facing) delivered. FR40–FR44 covered.

### Story 8.1: Plugin loader with asyncio isolation

As a developer,
I want a plugin loader that discovers and invokes plugins with failure isolation,
So that a misbehaving plugin cannot crash the app or corrupt the corpus.

**Acceptance Criteria:**

**Given** `src/latestnews/ingest/plugin_host.py` exists
**When** the backend boots
**Then** all `plugins/*.py` files are discovered
**And** each plugin is validated against the contract defined in `plugin_api.py` (must expose `matches(url) -> bool` and `async ingest(url) -> IngestResult`)
**And** plugins failing validation are logged to `!DOCS/plugin-errors/` and skipped (boot continues)

**Given** an ingest request arrives at the coordinator
**When** `plugin_host.py` selects a plugin
**Then** the plugin is invoked inside an asyncio task with `asyncio.wait_for` timeout of 30 s
**And** any exception is caught via try/except boundary
**And** the offending item is quarantined (error state; original URL preserved)
**And** the exception is logged with plugin name, item id, stack trace to `!DOCS/plugin-errors/`

### Story 8.2: Plugin contract tests

As a developer,
I want automated plugin contract tests running in CI,
So that any plugin we ship (or a contributor submits) conforms to the documented interface.

**Acceptance Criteria:**

**Given** `tests/plugin_contract/` exists
**When** `pytest tests/plugin_contract/` runs
**Then** each plugin in `plugins/` is tested against a fixture input from `tests/plugin_contract/fixtures/<plugin_name>/`
**And** the test asserts `matches()` returns a boolean, `ingest()` returns a valid `IngestResult` with required fields, and malformed inputs raise the expected exceptions
**And** CI fails if any plugin does not pass

**Given** a new plugin is added
**When** its fixture is committed alongside the plugin file
**Then** the contract test picks it up automatically without additional test code

### Story 8.3: Built-in ingest plugins (URL, PDF, image, X, YouTube)

As a user,
I want capture to work out-of-the-box for URLs, PDFs, images, X posts, and YouTube videos,
So that MVP covers the five most common content types.

**Acceptance Criteria:**

**Given** each built-in plugin (`url_html.py`, `pdf.py`, `image.py`, `x_post.py`, `youtube.py`) exists in `plugins/`
**When** I capture a URL matching each plugin's `matches()` rule
**Then** the plugin fetches the content, parses it, and returns an `IngestResult` with `title`, `body`, `source`, `source_type`, and any type-specific metadata
**And** the plugin contract tests pass for each

**Given** the `url_html` plugin handles generic HTML
**When** a URL matches no other plugin
**Then** `url_html` is the fallback
**And** it extracts title, body text, and basic metadata using a standard HTML parser

**Given** the `x_post` plugin fetches X posts
**When** rate limits or authentication issues occur
**Then** the plugin fails gracefully with a quarantined item (error state; retry available)

### Story 8.4: Settings route with all sections

As a user,
I want a Settings route where I can configure my data root, shared shelves, LLM provider, default sensitivity, and theme,
So that I can adapt the app to my workflow.

**Acceptance Criteria:**

**Given** I navigate to `/settings`
**When** the page loads
**Then** a two-column layout renders with 240 px section nav + content pane
**And** sections include: Data root, Shared shelves, LLM provider, Sensitivity default, Theme

**Given** I modify a low-risk field (theme toggle, default sensitivity)
**When** I change the value
**Then** the change auto-saves and a toast confirms

**Given** I modify the data root path or a shared shelf path
**When** I click Save
**Then** a confirmation Dialog opens ("Changing data root will re-index from new location. Continue?")
**And** on confirm, the change is persisted and the app re-indexes

**Given** settings persist between sessions
**When** I close and reopen the app
**Then** my theme, default sensitivity, LLM provider, and paths are restored from `${dataRoot}/.latestnews/settings.json`

### Story 8.5: AGENTS.md operative + self-indexing !DOCS/

As a developer,
I want `AGENTS.md` to be authoritative documentation and `!DOCS/` to be searchable by the product itself,
So that onboarding new contributors (human or AI) is under 30 minutes and docs never drift from reality.

**Acceptance Criteria:**

**Given** `AGENTS.md` exists at repo root
**When** I inspect it
**Then** it contains operative sections: "How to add an ingest plugin", "How to add an LLM provider", "How to run tests", "How to update the gold dataset", "How to contribute"
**And** each section is kept current as a PR-template-enforced norm (NFR-Q4)

**Given** I follow the "How to add an ingest plugin" walkthrough with no prior context
**When** I complete the steps
**Then** a new plugin works end-to-end within 30 minutes
**And** the contract test passes

**Given** the backend boots with self-indexing enabled
**When** `qmd_adapter` scans `!DOCS/` alongside the data root
**Then** `AGENTS.md`, `CHANGELOG.md`, and all planning artefacts are indexed
**And** a search query like "how do I add a new ingest plugin?" returns the relevant section of `AGENTS.md` in the top 3 results
**And** the self-indexing test `tests/search_quality/` includes at least one gold query for `!DOCS/` content

---

## Epic 9: Onboarding, Polish & Release

Deliver the first-launch pre-seed experience, empty states and loading skeletons, shortcut hints, accessibility audit, animation polish pass, and visual-quality external review as the release gate. Journey 1 fully delivered; MVP release gated here.

### Story 9.1: Pre-seed pipeline and FirstLaunchHero

As a user,
I want my app to greet me with a working, pre-populated wiki on first launch,
So that I immediately see the value rather than face an empty canvas.

**Acceptance Criteria:**

**Given** the app is launched with an empty data root
**When** the backend boots
**Then** `src/latestnews/preseed/pipeline.py` fetches curated items from bundled sources
**And** if network is unavailable, a bundled fallback content set ships inside the app
**And** ≥ 15 items populate the corpus within 60 s p95

**Given** the Dashboard loads for the first time
**When** the pre-seed completes
**Then** the `PreSeedBanner` component is visible at the top of the center pane
**And** it shows a `display-2` title ("Your wiki starts here") on `--gradient-hero-space`
**And** two ghost buttons are present: "Keep everything" / "Clear pre-seeded"

**Given** the banner is visible
**When** I click "Clear pre-seeded"
**Then** a Dialog confirms; on confirm, all pre-seeded items are removed from the corpus
**And** the banner fades out (soft 360 ms) and never reappears

**Given** I take my first successful action (paste, search, or navigate Explore)
**When** the action completes
**Then** a single non-modal shortcut-hint toast surfaces (e.g. "Cmd-V captures from anywhere · Cmd-K searches · Cmd-J chats · ? shows all shortcuts")
**And** it auto-dismisses after 8 s
**And** it never reappears unless the user opens `?`

### Story 9.2: Empty states, loading skeletons, and notification polish

As a user,
I want every empty or loading state to feel intentional and offer a next action,
So that the app feels alive even before it has data.

**Acceptance Criteria:**

**Given** any empty context defined in the UX spec (dashboard with no items, shelf with no items, search zero results, chat no matches, Explore corpus < 10, settings no LLM provider)
**When** the context is reached
**Then** the specified empty-state copy and next-action CTA render
**And** the UI never shows a blank white area or apologetic tone

**Given** any async data fetch is in progress
**When** skeleton components render
**Then** `ItemRowSkeleton` / `GraphSkeleton` match the final component's rhythm exactly (no layout shift on load)
**And** skeletons respect `prefers-reduced-motion` (shimmer → static placeholder)

**Given** the toast system is active
**When** multiple notifications arrive within a short window
**Then** the Sonner stack caps at 3 visible; additional toasts queue and appear as earlier ones dismiss
**And** hover-pause works across all variants

### Story 9.3: Accessibility audit and enforcement

As a user with assistive needs,
I want the app to meet WCAG 2.1 AA on every shipped route,
So that I can use LatestNews with keyboard-only, screen reader, or reduced-motion preferences.

**Acceptance Criteria:**

**Given** Playwright e2e tests run in CI
**When** axe-core is invoked on Dashboard, Explore, Settings, and the Cmd-K palette
**Then** zero accessibility errors are reported
**And** the CI job fails on any axe-core error
**And** the workflow is defined in `.github/workflows/a11y.yml`

**Given** I complete a mouse-free walkthrough of the three primary journeys (first-launch, capture, rediscovery)
**When** only the keyboard is used
**Then** every primary action can be performed
**And** focus is never trapped in an unexpected location
**And** focus returns to the triggering element on overlay close

**Given** I enable VoiceOver (macOS)
**When** I walk through the first-launch and rediscovery journeys
**Then** landmarks (`<main>`, `<nav>`, `<aside>`) are announced per route
**And** ingest-progress changes, chat tokens, and conflict notifications are announced via ARIA live regions
**And** icon-only buttons carry `aria-label` matching the action verb

**Given** I enable `prefers-reduced-motion` at the OS level
**When** I use any surface that normally animates
**Then** all Motion variants degrade to instant state changes
**And** no information is lost (ingest states still change; just without cross-fade)

### Story 9.4: Visual polish pass and external-reviewer release gate

As a stakeholder,
I want an external reviewer to confirm the product meets the Linear / Raycast / Arc / Superhuman quality bar,
So that release is gated on a qualitative judgement, not just passing tests.

**Acceptance Criteria:**

**Given** all feature epics (1–8) and Epic 9 stories 9.1–9.3 are complete
**When** a day-5 (or equivalent) review window opens
**Then** every motion variant (enter, exit, settle, pulse, press, stagger, glow-breathe) is audited end-to-end across the app
**And** all interactive surfaces sustain 60 fps on baseline hardware (measured via Chrome DevTools performance recording)

**Given** the visual polish audit runs
**When** every component is inspected
**Then** no raw hex colour, arbitrary spacing value, or one-off shadow is found in component source (Biome rule or review-enforced)
**And** every focus ring uses `--shadow-glow-accent`
**And** every gradient usage comes from a pre-composed gradient token

**Given** a first-use video walkthrough is recorded
**When** a reviewer unfamiliar with the project views it
**Then** their judgement on "is this the quality level of a shipped consumer product like Linear / Raycast / Arc / Superhuman?" is captured in writing
**And** if the judgement is negative, the day-6/7 buffer is spent on polish (not on new features) until the bar is met
**And** release is not declared until the judgement is positive — this is the release gate

**Given** the release gate is met
**When** the first release tag is cut
**Then** `!DOCS/CHANGELOG.md` is updated with the release notes
**And** the release artefact includes the scaffold + all custom components + plugins + preseed content + bundled font files


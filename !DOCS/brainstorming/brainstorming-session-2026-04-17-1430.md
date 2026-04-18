---
stepsCompleted: [1, 2, 3, 4]
session_active: false
workflow_completed: true
inputDocuments: []
session_topic: 'LatestNews — local file-based personal knowledge app: collect from X/YouTube/PDF/images, build searchable LLM-wiki with QMD, hybrid visualization (Obsidian + custom explore page). Educational example project.'
session_goals: 'Wide exploration: feature ideas, MVP scope, architecture/tech stack brainstorming'
selected_approach: 'progressive-flow'
techniques_used: ['What If Scenarios', 'Mind Mapping', 'First Principles Thinking', 'Resource Constraints']
ideas_generated: 18
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** csacsi
**Date:** 2026-04-17

## Session Overview

**Topic:** LatestNews — a locally-running, file-based personal knowledge app. Users submit content (X links, YouTube links, PDFs, images, anything) via a small webapp. Content is processed into markdown and indexed by QMD (local markdown search engine with BM25 + vector + LLM reranking + MCP). Visualization is hybrid: Obsidian graph view of the `!DOCS/` folder AND a custom "Explore" page (react-force-graph) in the webapp. Architecture must be clean, tested, with `AGENTS.md` describing how to add new tasks/features. All new feature docs go into `!DOCS/`; a working log tracks what was done; the docs themselves are indexed into the wiki (self-referential). Serves as an example project for upcoming AI training.

**Goals:**
- Feature ideas (broad)
- MVP scope definition
- Architecture & tech stack brainstorming

### Context Guidance

- Tech anchor: **QMD** (github.com/tobi/qmd) for local search
- Visualization: **Obsidian** for free-out-of-the-box + **custom page** for teaching value
- All state is file-based; local-first; no cloud dependency
- Project is an **educational artifact** — simplicity & teachability are first-class constraints

### Session Setup

- **Approach:** Progressive Technique Flow (4 phases: divergent → convergent)
- **Techniques:**
  - Phase 1 (Expansive Exploration): **What If Scenarios**
  - Phase 2 (Pattern Recognition): **Mind Mapping**
  - Phase 3 (Idea Development): **First Principles Thinking**
  - Phase 4 (Action Planning): **Resource Constraints**

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Systematic development from exploration to action

**Progressive Techniques:**

- **Phase 1 - Exploration:** What If Scenarios — break constraint-thinking, get wild ideas
- **Phase 2 - Pattern Recognition:** Mind Mapping — cluster ideas visually into functional areas
- **Phase 3 - Development:** First Principles Thinking — strip to fundamentals, identify must-haves
- **Phase 4 - Action Planning:** Resource Constraints — force MVP scoping under time/complexity limits

**Journey Rationale:** This project is a teaching artifact, so we need wide ideation first (to show students the option space), then structured clustering (to show how to organize), then distillation to essentials (so MVP is teachably small), then explicit scoping (so delivery is realistic). The techniques mirror real product design: dream → group → distill → commit.

## Phase 1: Expansive Exploration — Results

**Technique:** What If Scenarios
**Ideas generated:** 18

### Ideas Captured (all 18)

**[Ingest #1]: Frictionless Drop**
- _Concept:_ Paste a link. Done. No mandatory fields, no prompts, no folder decision at capture time.
- _Novelty:_ Reverses the Notion/Obsidian pattern of "decide first, capture second."

**[Search #2]: "Have I Seen This Before?" as primary query**
- _Concept:_ The default search is conceptual, not keyword-based. You come back to rediscover, not to find for the first time.
- _Novelty:_ QMD's BM25+vector+rerank stack is a natural fit for this "rediscovery" pattern.

**[Connection #3]: Compare as first-class operation**
- _Concept:_ When a new AI tool drops, one click shows side-by-side comparison with prior notes on similar tools.
- _Novelty:_ The wiki is a decision-support system, not an archive.

**[Viz #4]: Multi-Lens Explore Page**
- _Concept:_ Same knowledge graph, multiple lenses: time / topic / contradiction / emotion.
- _MVP decision:_ Ship with 1 lens (topic), add others post-MVP.
- _Novelty:_ Teaches that the same data can tell many stories — strong educational value.

**[Organization #5]: Topic Shelves (first-class)**
- _Concept:_ AI / Recipes / Home Renovation / Parenting are first-class "shelves," not tags.
- _Novelty:_ Shelves know about their domain (see #19 for per-shelf behavior).

**[Usecase #6]: AI Tool Radar**
- _Concept:_ When a new AI tool is announced, instantly query "do I already have notes on similar tools?"
- _Novelty:_ Turns the wiki into active decision support in the moment.

**[Voice Ingest #7]** (Post-MVP)
- _Concept:_ Say "remember this from the XY podcast" to your phone → app transcribes, files, links.

**[Mobile Client #8]** (Post-MVP)
- _Concept:_ Native or PWA client. Share-sheet integration.

**[Telegram Bot Ingest #9]** (Post-MVP but near-term)
- _Concept:_ Dedicated Telegram bot. Send link → bot ingests, indexes. Lowest-friction capture.
- _Novelty:_ Telegram is already on your phone — no new app, no login, no plugin.
- _Status:_ TODO task for post-MVP iteration 1.

**[Multi-User #10]: Shared Shelves (MVP)**
- _Concept:_ A shelf can be personal or shared with a group (family, coworkers, friends).
- _MVP decision:_ Multi-user IS included in MVP — retrofitting later is painful.
- _Novelty:_ Not social network, but family/team knowledge cooperation.

**[Privacy #11]: Privacy Layer (MVP — basic)**
- _Concept:_ Each item carries a sensitivity signal (personal / shared / publishable). LLM never leaks across these boundaries.
- _MVP decision:_ Basic version in MVP, critical because multi-user is MVP.

**[Chat #12]: Chat with Your Wiki (via QMD MCP)**
- _Concept:_ Ask your knowledge base in natural language: "what did I think about AI coding 6 months ago?"
- _Decision:_ Confirmed — QMD's MCP server gives this for free. Just surface in dashboard.

**[Auto-Discovery #13]: Interest Crawler**
- _Concept:_ Feed it your X handle, YT channels, news sites (e.g., telex.hu). Scheduled crawl brings you new relevant items into a "weekly inbox" — 1-click keep or dismiss.
- _Novelty:_ Wiki actively feeds itself. X via playwright/Nitter; YT via RSS; news via RSS/scrape.
- _Status:_ Likely post-MVP but design with it in mind.

**[Testing #14]: Search Quality Regression Suite**
- _Concept:_ Fixed "gold" dataset of markdown files. Fixed test queries → expected top-N results and expected graph edges. Runs on every change — you know if search quality regressed.
- _Novelty:_ Rarely done in amateur RAG projects. High educational value — shows how to test AI-adjacent systems, not just deterministic units.
- _MVP decision:_ In MVP.

**[Personalization #15]: Interest Profile**
- _Concept:_ The wiki itself is the user profile. New content relevance is measured against the full corpus.
- _Novelty:_ Not a preferences questionnaire — the profile emerges from usage.

**[Feedback #16]: Thumbs Up/Down**
- _Concept:_ Simple binary feedback on auto-discovered items and manual saves. Feeds #15.
- _Novelty:_ Minimal UI cost, maximum learning signal.

**[Contradiction #17]: Contradiction Highlighter**
- _Concept:_ On ingest, LLM checks if this new claim conflicts with something in the wiki. If yes, surface a card: "In 2024 you saved X; this new item disputes it."
- _Novelty:_ The wiki becomes a thought test — you negotiate with your past self.
- _MVP decision:_ In MVP (tied to AI auto-processing pipeline).

**[Onboarding #18]: Zero-Config Demo Seed**
- _Concept:_ First launch pre-pulls a handful of items from common sources (e.g., HN top / Telex featured / YT trending AI). You see a working mini-wiki immediately — no empty state.
- _Novelty:_ First impression is "it works" instead of "what do I put in?"
- _MVP decision:_ In MVP.

**[Per-Shelf Behavior #19]: Shelves Know Their Domain** (derived from W-4)
- _Concept:_ AI shelf auto-applies a "tool comparison" template. Recipes shelf expects images + cook time. Home reno tracks costs, filters by room. Parenting uses age-horizon fields.
- _MVP decision:_ Simple uniform shelves in MVP; per-shelf behavior post-MVP.

**[AI Processing Pipeline #20]: Auto TL;DR + Key Questions + Related Links**
- _Concept:_ On ingest, LLM produces: (a) 3-sentence TL;DR, (b) 3 key questions the content raises for you, (c) suggested links from existing wiki ("there are 4 items on this already").
- _Novelty:_ Every new item instantly more valuable; the wiki does its own busywork.
- _MVP decision:_ In MVP — "ultra important" per user.

**[Plugin Architecture #21]: Drop-in `.py` Plugins**
- _Concept:_ New content types added by dropping a Python file in `plugins/` folder (e.g., Spotify, Kindle highlights).
- _MVP decision:_ Design the architecture to support plugins; ship only built-ins in MVP.
- _Novelty:_ Students can write plugins as exercises.

### MVP vs Post-MVP Running Tally

**In MVP:** #1, #2, #3, #4 (1 lens only), #5 (simple), #6, #10, #11 (basic), #12, #14, #15, #16, #17, #18, #20

**Post-MVP:** #4 (more lenses), #7, #8, #9 (Telegram), #13 (auto-discovery), #19 (per-shelf behavior), #21 (real plugins — design in MVP, implement post)

**Rejected / Out of Scope:** multi-machine sync, flashcard/Anki export

### Phase 1 Facilitation Notes

**User creative strengths:** Quick to commit to decisions, strong product instinct for cutting scope while preserving the "wow" moment, excellent at identifying what would be "painful to retrofit" (multi-user) vs. what can wait (sync, mobile).

**Breakthrough moments:**
1. The "chat with wiki" realization that QMD MCP already provides it — unblocked design space.
2. The auto-discovery crawler (W-13) — user's own idea, shifted the app from passive store to active companion.
3. The decision to pre-seed the wiki on first launch — kills the dead empty-state problem.

**Anti-bias domain coverage:** ingest / processing / search / storage / visualization / multi-user / personalization / delight / onboarding / testing / dev-experience / extensibility. Good diversity.

## Phase 2: Pattern Recognition (Mind Mapping)

All 18 ideas organized into 9 functional clusters, with cluster-richness analysis identifying gaps.

### Clusters

**1. INGEST (Rich — 5 ideas)** — #1 Frictionless Drop · #7 Voice · #8 Mobile · #9 Telegram · #13 Auto-discovery
**2. AI PROCESSING (Medium — 2)** — #17 Contradiction · #20 Auto TL;DR/Related/Questions
**3. STORAGE (Medium — 3)** — #5 Topic Shelves · #19 Per-shelf behavior · Obsidian-compatible markdown
**4. SEARCH & QUERY (Rich — 4)** — #2 Rediscovery · #3 Compare first-class · #6 AI Tool Radar · #12 Chat with wiki
**5. VISUALIZATION (Sparse — 1+)** — #4 Multi-Lens + free Obsidian graph view *(flagged as gap)*
**6. MULTI-USER (Medium — 2, high risk)** — #10 Shared Shelves · #11 Privacy Layer
**7. PERSONALIZATION (Medium — 2)** — #15 Interest Profile · #16 Thumbs feedback
**8. DEV EXPERIENCE (Rich — 3)** — #14 Search regression suite · #21 Plugin architecture · AGENTS.md + self-indexing `!DOCS/`
**9. DELIGHT / ONBOARDING (Sparse — 1)** — #18 Zero-config demo seed *(flagged as gap)*

### Cross-cluster connections

- AI Processing → feeds Visualization (contradiction lens)
- Feedback #16 → Interest Profile #15 → Auto-discovery relevance #13
- QMD MCP → powers both Chat #12 and Compare/Radar #3/#6
- `AGENTS.md` + self-indexing docs → meta feature crossing Dev-Experience and Search

## Phase 3: Idea Development (First Principles)

### Core Value Hypothesis (confirmed)

> "I paste a link → LLM processes it → later I come back and either rediscover what I needed, or realize I already knew something about it. The wiki grows in value with every new item."

### Cluster-by-cluster fundamentals → minimums

- **INGEST:** Dashboard textbox + drag-drop. All other channels route through same pipeline. Mobile/Telegram/Voice = post-MVP.
- **AI PROCESSING:** TL;DR mandatory + related-items suggestion. 3-questions = nice but optional delight.
- **STORAGE:** `.md` + YAML frontmatter. Subfolder = shelf. No DB.
- **SEARCH:** Two interfaces only — search bar + chat. Compare/Radar = chat templates, not features.
- **VISUALIZATION:** Obsidian gives 80%. Custom Explore page = single topic-lens, other lenses post-MVP.
- **MULTI-USER:** Shared filesystem folder = shared shelf. No auth, no backend, no real-time sync.
- **PERSONALIZATION:** 👍/👎 writes `rating` to frontmatter → QMD rerank boost. That's it.
- **DEV EXPERIENCE:** `AGENTS.md` + `!DOCS/` conventions + search regression suite. Plugin architecture designed but not implemented in MVP.
- **DELIGHT:** Pre-seed on first launch = enough for MVP.

### Hard decisions locked

| Challenge | Decision |
|-----------|----------|
| #17 Contradiction detector | Post-MVP |
| Viz lenses in MVP | 1 lens only (topic) |
| Multi-user mechanism | Shared folder (no auth/backend) |
| Search surface count | 2 only (search bar + chat) |

## Phase 4: Action Planning (Resource Constraints)

### 5-day MVP plan (+2-day buffer)

**Day 1 — Foundation:** Monorepo scaffold, folder structure (`!DOCS/`, `src/{ingest,processor,search,web}`, `tests/search_quality/`), `AGENTS.md` stub, QMD installed, sample markdown indexed, empty dashboard with input field.

**Day 2 — Ingest + Storage:** `ingest/url.py`, `ingest/pdf.py`, `ingest/image.py`. Frontmatter schema: `title, source, shelf, tags, sensitivity, rating, created_at`. User picks shelf or defaults to `inbox/`.

**Day 3 — AI Processing + Pre-seed:** TL;DR generation on ingest (Ollama or Claude — decided in architecture phase), related-items query to QMD top-3, onboarding pre-seed from common sources on first launch.

**Day 4 — Search + Chat + Feedback:** Dashboard search bar → QMD hybrid search, chat widget via QMD MCP, 👍/👎 buttons writing to frontmatter and boosting rerank.

**Day 5 — Viz + Testing + Self-indexing:** Explore page with react-force-graph (1 topic lens), Obsidian compatibility verified, search quality regression suite (10-item gold dataset, 5 test queries, top-3 assertions), `!DOCS/` self-indexing confirmed (can search the wiki about the wiki), final `AGENTS.md`.

**Day 6–7 — Buffer:** Multi-user via shared folder env var, privacy filtering in QMD queries, demo recording, README.

### Drop-if-slipping list

| Dropable | Safe because |
|---------|--------------|
| Custom Explore page | Obsidian graph view is free |
| 👍/👎 feedback | Read-only is fine for MVP |
| Image OCR | Just store the image for MVP |

### Must-keep list

- Chat widget (wow moment)
- Search regression suite (educational gold)
- Pre-seed onboarding (first impression)

### Hard success criteria (MVP Definition of Done)

1. URL paste → well-formed markdown + TL;DR within 10s
2. Natural-language question to chat → cited answer from wiki
3. Obsidian opens `!DOCS/` and shows a meaningful graph
4. Custom Explore page renders 50+ nodes
5. `npm test` (or equivalent) → 5 search quality assertions pass
6. Adding a new feature via `AGENTS.md` takes ≤30 min
7. `AGENTS.md` and `!DOCS/CHANGELOG.md` are searchable via the wiki's own search

## Idea Organization and Prioritization

### Final MVP scope (21 ideas distilled to 15 MVP items)

**IN MVP:**
- #1 Frictionless Drop (dashboard input + drag-drop)
- #2 Rediscovery search
- #3 Compare (as chat template)
- #4 Explore page (1 lens)
- #5 Topic Shelves (simple subfolders)
- #6 AI Tool Radar (as chat template)
- #10 Shared Shelves (shared folder mechanism)
- #11 Privacy Layer (frontmatter sensitivity field)
- #12 Chat with wiki (QMD MCP)
- #14 Search regression suite
- #15 Interest Profile (wiki + ratings)
- #16 👍/👎 feedback
- #18 Onboarding pre-seed
- #20 AI auto-processing (TL;DR + related)
- #21 Plugin-ready architecture

**POST-MVP (deferred):** #7 Voice · #8 Mobile · #9 Telegram · #13 Auto-discovery · #17 Contradiction · #19 Per-shelf behavior · more viz lenses · export/publish · daily delight cards · real plugins

**OUT:** flashcard/Anki · native multi-machine sync

### Next Steps — BMad Workflow

The brainstorming session is complete. Recommended next BMad skills (each in a fresh context window):

1. **`bmad-create-prd`** — Turn this MVP scope into a Product Requirements Document.
2. **`bmad-create-architecture`** — Tech-stack decisions: language choice (full TypeScript vs. Python side-pipeline), LLM provider for auto-processing (Ollama local vs. Claude API vs. hybrid), hosting, folder layout.
3. **`bmad-create-epics-and-stories`** — Each day becomes an epic; each Definition-of-Done item becomes a story.
4. **`bmad-check-implementation-readiness`** — Sanity check before coding.
5. **`bmad-sprint-planning`** → **`bmad-create-story`** → **`bmad-dev-story`** loop — Daily implementation cycle.

## Session Summary and Insights

### Key Achievements

- 18 novel ideas generated across 9 functional clusters
- Core value hypothesis articulated and confirmed
- 4 hard product decisions made under First Principles pressure
- 5-day MVP plan with explicit drop-list and hard success criteria
- Clear handoff to PRD + Architecture phases

### Creative Breakthroughs

1. **QMD + MCP = Chat-with-wiki for free** — unblocked the "talk to your knowledge" design space without building a custom RAG stack.
2. **Auto-discovery crawler (W-13)** — shifted the product from passive archive to active companion.
3. **Shared folder = multi-user** — reduced multi-user from a backend-sized problem to a filesystem convention.
4. **Self-indexing `!DOCS/`** — the documentation IS part of the wiki. Meta-feature, high educational value.

### Session Reflections

The user came in with a crisp idea and strong product instincts. Phase 1 expanded the option space to 18 ideas. Phase 2 revealed a gap in visualization (addressed by deferring to Obsidian + 1 custom lens) and delight (addressed pragmatically by pre-seed). Phase 3 was the highest-leverage phase: four hard cuts saved weeks of scope (contradiction detector, extra lenses, auth stack, extra search surfaces). Phase 4 delivered an executable week-shaped plan with a credible drop-list.

The project's educational angle is a genuine differentiator rather than a tacked-on label — the regression tests, plugin architecture, `AGENTS.md`, and self-indexing docs are both useful and teachable.




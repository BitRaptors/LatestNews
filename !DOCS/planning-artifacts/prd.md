---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation-skipped', 'reconciliation-mcp-secondary', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
completedAt: '2026-04-17'
inputDocuments:
  - '!DOCS/brainstorming/brainstorming-session-2026-04-17-1430.md'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  audience: b2c_consumer
  complexity: low
  projectContext: greenfield
  uxEmphasis: high
  notes: 'B2C consumer app with wow-factor / polished UX as first-class requirement. Plugin architecture + AGENTS.md + self-indexing docs give it a secondary educational-artifact character, but the primary user-facing product is a consumer knowledge app.'
workflowType: 'prd'
---

# Product Requirements Document - LatestNews

**Author:** csacsi
**Date:** 2026-04-17

## Executive Summary

**LatestNews** is a local-first, file-based personal knowledge web application. Users capture content frictionlessly — X posts, YouTube videos, PDFs, images, any link — and the app processes each item into searchable markdown indexed by a hybrid BM25 + vector + LLM-rerank engine (QMD). The primary use case is **rediscovery**: surfacing what the user has already seen and thought about, rather than finding new information. A natural-language chat panel in the web UI lets the user converse with their own knowledge base directly; the same capability is also exposed as an optional MCP server for power users who prefer to query from external LLM clients (Claude Desktop, Cursor).

The target user is a single curious knowledge worker who consumes 20–50 pieces of valuable content daily and loses 95% of it. Existing tools (Notion, Obsidian) fail because capture friction is too high; web search fails because it cannot query the user's personal context. LatestNews reduces capture to a paste-and-forget action and turns the resulting corpus into a queryable extension of the user's own thinking. Shared shelves (via filesystem folders) extend the experience to small teams and families without adding backend complexity.

### What Makes This Special

Five reinforcing properties distinguish LatestNews from note-taking and bookmark tools:

1. **Rediscovery-first search.** The default query is "have I seen this before?" — not "find me something new." Hybrid ranking (BM25 + vector + rerank) is tuned for conceptual re-encounter, the behavior conventional search treats as a rare edge case.
2. **Chat with your wiki in the dashboard.** A chat panel in the web app lets the user ask natural-language questions of their corpus and receive cited answers — no external client needed. The same QMD-backed retrieval is also reachable via an optional MCP server for users who want to query from Claude Desktop, Cursor, or similar; that path is a bonus, not the main surface.
3. **Frictionless capture.** Paste a link; the app decides the rest. No mandatory tags, folders, or forms at capture time. Classification happens asynchronously in the AI processing pipeline.
4. **Never-empty state.** First launch pre-seeds the wiki with items from curated sources so the user sees a working mini-wiki in the first minute, not a blank input field.
5. **Passive learning.** Thumbs-up / thumbs-down on items writes a `rating` into the markdown frontmatter, which QMD's reranker boosts on subsequent queries. The interest profile emerges from usage rather than from a preferences questionnaire.

The core insight enabling all of the above: **QMD + MCP + Obsidian together already solve the hard RAG, chat, and graph-visualization problems**. The product's work is not to rebuild that infrastructure but to wrap it in a consumer experience tight enough to produce a "wow" on first contact. This architectural leverage is what keeps the MVP achievable within the week-shaped build plan described in *Scope & Roadmap*.

## Project Classification

- **Project Type:** Web application (browser-based dashboard and Explore graph page; PWA-compatible)
- **Domain:** General consumer productivity (no regulated-industry compliance surface)
- **Audience:** B2C — primary single-user flow, secondary small-team / family flow via shared filesystem folders
- **Complexity:** Low — no backend, no authentication, no multi-machine sync; all state lives in the local filesystem
- **Project Context:** Greenfield — new product, no existing codebase to migrate from or integrate with
- **UX emphasis:** High — polished visual and interaction design is a first-class requirement, not a post-launch polish pass
- **Quality posture:** Reference-grade internal engineering (comprehensive tests, plugin-ready architecture, `AGENTS.md`, self-indexing `!DOCS/`) held to production standards even where the user-facing feature surface is small

## Success Criteria

### User Success

The MVP is a success for the user when each of the following behaviors can be observed within the first week of real use:

- **Rediscovery works on first try.** The user types a fragment of something they saved weeks ago and the correct item appears in the top 3 results. Measured via the search-quality regression suite: ≥ 4 of 5 gold queries return the expected item in top 3.
- **Chat answers feel native.** Asked a natural-language question in the dashboard chat panel, the user receives a cited answer drawn from their own items — not a generic LLM response. Measured qualitatively in the onboarding demo script.
- **Capture is truly frictionless.** Time from copied URL to item being searchable is ≤ 10 seconds end-to-end (including TL;DR generation). No blocking form, no mandatory metadata.
- **Never an empty state.** On first launch, the user sees a pre-seeded wiki with ≥ 15 items from curated sources, rendered in the custom Explore page, within 60 seconds of first run. Obsidian vault compatibility is verified separately as a storage-model property, not as a first-launch gate.
- **The product gets smarter passively.** After 20 thumbs-up/down actions, the user can observe measurable rerank changes on a stable test query. No explicit tuning required.

### Business Success

LatestNews has no monetization model. Business success is measured purely through sustained personal and small-team adoption:

- **Return frequency.** The primary owner uses the app on ≥ 5 of 7 days in a typical week during the month following MVP release.
- **Capture volume.** The primary owner ingests ≥ 30 new items in the first month of real use — proving capture friction is genuinely low.
- **Corpus stickiness.** After 90 days, the user has not abandoned the tool for a competing product; the corpus has grown monotonically.
- **Shared-shelf validation.** At least one shared shelf is created and used by ≥ 2 people within the first 60 days — confirming the filesystem-based multi-user model holds up in practice.

### Technical Success

Drawn from the brainstorming's MVP Definition of Done, with measurable targets:

- **Search quality regression suite passes.** A 10-item gold dataset and 5 fixed test queries produce deterministic top-N assertions on every commit. Any regression blocks merge.
- **End-to-end ingest latency ≤ 10s.** URL → parsed content → markdown file → TL;DR → searchable in the index within 10 seconds on developer hardware (M-series Mac or equivalent).
- **Chat latency ≤ 3s to first token.** Natural-language query in the dashboard chat panel returns a first token within 3 seconds. The optional MCP surface matches or exceeds this target.
- **Obsidian compatibility verified.** `!DOCS/` opens in a clean Obsidian vault and renders a non-trivial graph (≥ 50 nodes with non-zero edges) from pre-seeded content.
- **Custom Explore page renders 50+ nodes.** react-force-graph rendering stays above 30 fps at 50 nodes on baseline hardware.
- **`AGENTS.md` is operative.** A developer (or AI agent) unfamiliar with the codebase can add a new ingest type in ≤ 30 minutes by following `AGENTS.md` alone, with no additional context.
- **Self-indexing docs.** `AGENTS.md`, `!DOCS/CHANGELOG.md`, and the full `!DOCS/` tree are searchable through the wiki's own search. A query like "how do I add a new ingest plugin?" returns the relevant section of `AGENTS.md`.
- **Plugin architecture designed, not yet implemented.** The directory structure, interface contract, and discovery mechanism for `plugins/*.py` are documented and stubbed; no third-party plugin is required in MVP.

### Measurable Outcomes

Consolidated MVP acceptance checklist (gating release):

| # | Outcome | Measurement | Threshold |
|---|---------|-------------|-----------|
| 1 | Frictionless capture | URL → searchable time | ≤ 10 s |
| 2 | Rediscovery works | Gold-query regression suite | ≥ 4/5 pass |
| 3 | Chat works out-of-box | Dashboard chat panel returns cited answer | Manual demo pass |
| 3b | MCP surface works (secondary) | External MCP client returns cited answer | Manual demo pass |
| 4 | Obsidian graph meaningful | Graph view shows ≥ 50 nodes | Visual check |
| 5 | Custom Explore works | react-force-graph renders ≥ 50 nodes | Visual + fps check |
| 6 | Pre-seed works | First launch shows populated wiki | ≤ 60 s cold start |
| 7 | Feedback loop works | 👍/👎 shifts rerank on test query | Deterministic regression test |
| 8 | AGENTS.md operative | New ingest type added by fresh dev | ≤ 30 min |
| 9 | Self-indexing docs | Wiki search returns `!DOCS/` content | Manual check |

## User Journeys

### Persona — Primary User

**Name:** Réka, 34 — senior product designer.
**Situation:** Consumes 30–50 pieces of content daily across X, YouTube, newsletters, design case studies, and AI tool releases. Currently juggles Notion, Apple Notes, open browser tabs, and "saved for later" across three platforms. Nothing resurfaces when she needs it.
**Goal:** A single place she can paste anything into, trust it to be found later, and occasionally ask questions of her own past thinking.
**Obstacle:** Every existing tool demands upfront organization or becomes a graveyard of untagged links.
**Why LatestNews fits:** Paste and forget. Conceptual search. Chat with her own corpus. No setup tax.

### Persona — Secondary User (Shared Shelf Member)

**Name:** Márk, 38 — Réka's partner, works in finance.
**Situation:** Réka has a "Home Renovation" and "AI Tools" shelf she shares with him. He wants to add his own finds without learning a new app.
**Goal:** Drop a link from his phone into the shared shelf; browse what Réka has saved.
**Obstacle:** Any friction (login, install, sync setup) means he will stop using it within a week.

### Persona — Plugin Author / Contributing Developer

**Name:** Bence, 29 — Réka's colleague, hobby coder.
**Situation:** Sees Réka's setup, wants to add Spotify listening history as a new ingest source.
**Goal:** Write a single Python file, drop it in `plugins/`, have it work.
**Obstacle:** Most open-source projects demand hours of ceremony before a first PR.

### Journey 1 — First Launch & Pre-seed (Primary User, Onboarding)

**Opening scene.** Réka installs LatestNews for the first time at 9:47 pm on a Tuesday. She is skeptical — she has downloaded six "second brain" apps in the past two years and abandoned all of them within a week.

**Rising action.** She runs the app. The dashboard opens. Instead of the usual empty "Welcome! Add your first note" page, she sees an Explore graph with ~20 nodes already present — curated items from Hacker News, Telex, and a trending AI YouTube channel. A small banner reads *"Pre-seeded starter content — search it, dismiss it, or replace it. It's yours."*

**Climax.** She clicks a node labeled "Claude 4 release notes." A panel opens with the TL;DR, the original link, and three related items already linked. She hovers the graph — related topics pulse. She thinks: *"Oh. It already works."*

**Resolution.** She pastes a link to an X thread she saved earlier that day. Eight seconds later it appears in the graph, connected to the AI cluster. She closes the laptop. She decides to give the app a real week.

**Emotional arc:** skepticism → mild surprise → curiosity → trust.

**Capabilities revealed:**
- Cold-start pre-seed pipeline with curated sources
- Instant graph + Explore rendering on first launch
- Ingest happy-path visible and fast (sub-10-s)
- Onboarding copy tone: confident, non-preachy

### Journey 2 — Frictionless Capture (Primary User, Core Loop)

**Opening scene.** Three weeks in. Réka is scrolling X during lunch. She sees a brilliant thread about design tokens. Historically she would bookmark it and forget.

**Rising action.** She copies the URL, cmd-tabs to the LatestNews dashboard, pastes. That is the entire user action. She pastes 2 more links from 2 other tabs in 15 seconds. She returns to X.

**Climax.** Thirty seconds later a soft toast in the corner of the dashboard reads *"3 items indexed. 1 may relate to your 'Design Systems' shelf."* She ignores the toast — she is busy.

**Resolution.** She doesn't tag. She doesn't file. The items are already in the system, summarized, indexed, and tentatively shelved by the AI pipeline. Later the same day, when she searches "design tokens", those items are there.

**Edge case — ingest failure.** If the URL is paywalled or 404s, the item still lands in the inbox with a clearly-marked error state and the original URL. She can retry or delete it in one click. The system never silently loses a paste.

**Emotional arc:** routine → unburdened → quietly pleased.

**Capabilities revealed:**
- Paste-anywhere capture input (keyboard shortcut + drag-drop)
- Asynchronous AI pipeline: TL;DR, shelf suggestion, related-items
- Non-blocking UI — capture never requires user attention
- Graceful ingest failure handling with retry
- Soft notification layer (never modal, never interrupting)

### Journey 3 — The Rediscovery Moment (Primary User, Core Value)

**Opening scene.** Six weeks in. Réka is in a design review, arguing a point about component contrast. She remembers reading something months ago — a tweet? a blog post? — that had the perfect phrase. She cannot place it.

**Rising action.** She types into the dashboard search: *"contrast grouping principle"*. She does not remember the exact words. The hybrid ranking (BM25 + vector + rerank) surfaces a blog post she saved 3 months ago as the #1 result. The snippet shows the exact sentence she was looking for.

**Climax.** She copies the quote into the design review Slack in under 20 seconds. Two colleagues ask where she got it. She says "my wiki."

**Resolution.** She 👍s the item. Next time she searches anything adjacent, this item ranks higher. The wiki has now made her look prepared in a meeting — the first hard ROI moment.

**Edge case — search misses.** If the top 3 results don't contain the right item, she clicks the "chat with your wiki" button and asks in plain language: *"what did I save about contrast and visual grouping?"* The chat finds it via a different retrieval path and cites the source.

**Emotional arc:** mild panic → focused search → relief → visible competence → satisfaction.

**Capabilities revealed:**
- Hybrid search tuned for fuzzy, conceptual recall (not exact-keyword)
- Top-N ranking with visible snippet context
- Feedback-to-rerank loop (thumbs-up boosts rank on related queries)
- Chat fallback when search misses — same corpus, different interface
- Sub-second search latency at corpus size of 500+ items

### Journey 4 — Chat With the Wiki (Primary User, Secondary Wow)

**Opening scene.** Réka is drafting a feature proposal in her usual writing app. She has an open question: what does her year of accumulated reading on design systems actually recommend for her team?

**Rising action.** She opens the LatestNews dashboard and clicks the Chat tab. She types: *"Based on everything I've read about design systems in the last year, what's the one-sentence recommendation for our team?"* The chat streams back a synthesis, citing three items by title (each citation is a clickable link to the underlying markdown file).

**Climax.** The synthesis matches how she actually thinks — because it is drawn from her own curation. It is not a generic ChatGPT answer. She clicks a citation, reads the source, and quotes it verbatim in her proposal.

**Resolution.** The dashboard chat panel was the whole experience. No external client, no setup, no MCP config required.

**Power-user variant (secondary surface).** A month later, Réka also configures the optional QMD MCP server as a tool inside Claude Desktop. Now the same corpus is queryable from Claude Desktop and Cursor as well — but the dashboard remains her default. The MCP surface is an opt-in upgrade, not a prerequisite.

**Edge case — privacy.** Chat responses respect the `sensitivity` frontmatter on each item. Items marked `sensitivity: personal` are excluded from chat results when queries come from a shared context (the MCP surface with a "public" client profile configured, or a shared shelf's chat view). Private reflections never surface where they shouldn't.

**Emotional arc:** question in mind → direct answer from her own corpus → realization the value was her own curation.

**Capabilities revealed:**
- In-dashboard chat panel backed by QMD hybrid search + LLM synthesis with citations
- Streaming response UI with clickable citation links back to source markdown files
- Sensitivity filtering enforced at the retrieval boundary, consistent across dashboard chat and MCP surface
- Optional QMD MCP server exposing the same retrieval tools for external clients (Claude Desktop, Cursor)
- Citation metadata (title, source URL, shelf) preserved end-to-end on both surfaces

### Journey 5 — Shared Shelf With Partner (Secondary User, Multi-user)

**Opening scene.** Réka invites Márk to their shared "Home Renovation" shelf. No accounts, no invitations by email — she shares a folder from her Mac via iCloud Drive and tells him the folder path.

**Rising action.** Márk opens LatestNews on his own laptop. He adds the shared folder path in settings (single env var or config line). The shared shelf appears in his dashboard alongside his own shelves. He pastes three contractor quotes he has been sitting on.

**Climax.** Réka sees them appear in her copy of the dashboard on the next refresh (the filesystem changed; the index picked it up). She 👍s one of the quotes. The rating is written to the shared markdown file and visible to Márk too.

**Resolution.** No auth layer was built. No server was deployed. The filesystem is the collaboration primitive. If they ever fall out over the renovation, Réka removes the shared folder; Márk's copy stops syncing — clean separation.

**Edge case — concurrent writes.** If Réka and Márk modify the same item's frontmatter simultaneously, iCloud / Dropbox conflict files appear. The app detects `*(conflicted copy)*` files and surfaces them as a "resolve conflict" card — one click to keep one version.

**Emotional arc:** mild skepticism about multi-user → genuine surprise that filesystem is the whole mechanism → quiet confidence.

**Capabilities revealed:**
- Per-shelf folder path configuration (not mounted globally)
- File-system watcher that re-indexes on external changes
- Sensitivity filtering works per-shelf (shared shelves default to `sensitivity: shared`)
- Conflict resolution UI for filesystem-sync collisions
- Zero backend / zero auth — explicitly a non-requirement

### Journey 6 — Adding a New Ingest Plugin (Developer)

**Opening scene.** Bence wants to ingest his Spotify listening history. LatestNews has no Spotify plugin.

**Rising action.** He opens the repo, reads `AGENTS.md`. The file tells him: (a) create `plugins/spotify.py` with two functions — `matches(url)` and `ingest(url) -> {title, body, source, source_type}`; (b) drop sample Spotify URL into `tests/ingest_fixtures/`; (c) run `make test-ingest plugins/spotify.py`.

**Climax.** Twenty-five minutes later his plugin parses a Spotify track URL into a markdown file with artist, track, and playlist context. The regression tests pass. No other code in the repo was touched.

**Resolution.** He submits a PR. The self-indexing `!DOCS/CHANGELOG.md` is updated by the PR template. The wiki can now answer *"what did I listen to this week?"* via the same hybrid search it uses for articles.

**Edge case — plugin violates the contract.** If a plugin throws or returns malformed output, the ingest pipeline isolates the failure, logs it to `!DOCS/plugin-errors/`, and prevents the bad item from entering the index. Other plugins continue to work.

**Emotional arc:** curious → oriented fast → productive within 30 min → proud of the PR.

**Capabilities revealed:**
- Plugin discovery from `plugins/` directory at app boot
- Strict plugin interface contract (documented and enforced)
- Test harness per plugin with fixtures and golden outputs
- Error isolation: bad plugin cannot break the app
- `AGENTS.md` is a first-class artifact — accurate, minimal, operative
- Self-indexing `!DOCS/CHANGELOG.md` updates as a dev-workflow norm

### Journey Requirements Summary

| Capability area | Journeys revealing it |
|-----------------|----------------------|
| Pre-seed / onboarding pipeline | J1 |
| Paste / drag-drop capture UI | J1, J2 |
| Async AI processing (TL;DR, related, shelf suggestion) | J2 |
| Hybrid search with conceptual ranking | J3 |
| Dashboard chat panel with citations | J4, J3 (fallback) |
| Optional MCP surface (same retrieval) | J4 (power-user variant) |
| Feedback-to-rerank loop | J2, J3 |
| Shared shelf via filesystem path | J5 |
| Sensitivity filtering at retrieval boundary | J4, J5 |
| Filesystem watcher + conflict UI | J5 |
| Explore graph rendering (first-launch + ongoing) | J1 |
| Plugin loader + contract + isolation | J6 |
| `AGENTS.md` as operative doc | J6 |
| Self-indexing `!DOCS/` | J6 |
| Non-blocking, soft notification layer | J2 |
| Graceful ingest failure handling | J2 |

## Web Application Specific Requirements

### Application Shell

LatestNews is a **Single-Page Application (SPA)** running entirely on the user's machine against a local backend process. No multi-page navigation model, no server-rendered HTML, no public web surface.

- **Runtime:** local dev server during development. For release, a browser-pointed-at-localhost experience is the baseline; a native wrapper (Tauri, Electron, or similar) may ship later if desired. Runtime choice is deferred to the architecture phase and is not a PRD constraint.
- **Framework:** **React**. The Explore page requires `react-force-graph`; the rest of the app is built in the same framework to keep the stack coherent.
- **Routing:** client-side only. Key routes: `/dashboard` (capture + search + chat), `/explore` (graph), `/settings` (shared shelf paths, sensitivity defaults, LLM provider).

### Browser Matrix

Local-first deployment means the only browser constraint is what the user opens localhost in.

- **Supported:** latest two stable major versions of Chromium (Chrome, Edge, Arc, Brave), Safari 17+, Firefox current stable.
- **Not supported:** Internet Explorer, legacy Edge, Safari ≤ 16, any mobile browser in MVP (mobile / PWA is explicit post-MVP per the brainstorming decision).
- **Screen sizes:** desktop-first, minimum 1280×720. Below that, a polite "LatestNews is optimized for desktop" message is acceptable for MVP.

### Responsive Design

MVP is **desktop-first only.** Tablet and mobile layouts are explicit post-MVP work — no progressive-enhancement promises for smaller viewports in the first release.

- Fluid layouts where trivial (content containers, lists); fixed thresholds elsewhere.
- The Explore graph is not usable on mobile form factors and will not be made so in MVP.

### Performance Targets

Canonical latency budgets are specified in *Non-Functional Requirements › Performance* (NFR-P1 through NFR-P8). This subsection exists only to cross-reference; do not duplicate numbers here.

### Visual Polish & Motion Design

The visual quality bar is explicitly high. "B2C consumer app" is not a positioning label — it is a commitment. The user-facing surfaces must feel on par with well-funded modern consumer SaaS (Linear, Raycast, Arc, Superhuman). This is a first-class requirement, not a post-MVP polish pass.

**Visual quality gates (release-blocking):**

- **Typography system** with a deliberate scale, consistent line-heights, and generous vertical rhythm. No stock system-font fallback as a final state.
- **Color system** with tokenized light and dark themes at parity. Semantic tokens (surface, border, text-primary, text-muted, accent) rather than raw hex values in components.
- **Spacing system** on a fixed scale (e.g. 4 px base grid). No arbitrary pixel values in component padding/margin.
- **Iconography** from a single consistent family (Lucide, Phosphor, or equivalent). No mixed icon sets.
- **Elevation and surfaces** handled through a small set of shadow/blur tokens; no ad-hoc drop-shadows per component.

**Motion design (release-blocking):**

- Every meaningful state transition has a considered animation — not a default CSS transition and not an after-the-fact addition. Hover, focus, press, load, enter, exit, and layout shifts are all designed explicitly.
- **Graph animation (Explore page):** smooth force-graph settling on load, hover-pulse on related nodes, animated filter transitions when a lens or shelf changes.
- **Ingest feedback:** items enter the list with a subtle slide-and-fade; the AI pipeline progression (queued → indexed) is visualized inline, not via a spinner.
- **Chat streaming:** tokens fade in; citations animate their appearance at the end of the response.
- **Search results:** top results animate into place; relevance score (or boost from rating) is implied visually without being loud.
- **Micro-delight moments:** thumbs-up / thumbs-down has a satisfying tactile response (scale, color, brief celebratory particle or haptic-equivalent). Pre-seed onboarding on first launch uses a restrained hero animation that establishes product identity within 2 seconds.
- **Performance floor:** all animations maintain 60 fps on baseline hardware. `prefers-reduced-motion` is honored — animations degrade gracefully to instant state changes, never disappear into raw snap-cuts.

**What "done" looks like for polish:** a reviewer who has never heard of the project should, on first open, say "this feels like a shipped consumer product" — not "this feels like an open-source side project."

### Accessibility Level

**Target: WCAG 2.1 AA.** This is a consumer app with a high UX bar; accessibility is part of "polished," not an afterthought.

- **Keyboard-first:** every primary action (paste capture, search, open chat, navigate Explore, thumbs-up/down, open item, delete item) is keyboard-reachable without the mouse. The capture-paste workflow is inherently keyboard-driven.
- **Focus management:** visible focus rings in both themes; focus never escapes modal dialogs; focus returns to the triggering element on modal close.
- **Color contrast:** all text meets 4.5:1 against its background in both light and dark themes.
- **Screen reader support:** semantic HTML, ARIA labels on icon-only controls, live-region announcements for async ingest toasts. Full screen-reader walkthroughs are not a release gate, but the app must not be actively hostile (nested divs without roles, icon-buttons without labels, etc.).
- **Theme:** dark and light themes at parity. System-preference respected by default.
- **Motion:** `prefers-reduced-motion` honored — graph animations degrade to static layouts when requested.

### SEO Strategy

**Not applicable.** LatestNews has no public web presence; the app runs at `localhost`. SEO is explicitly out of scope.

### Real-Time Behavior

The app is reactive rather than hard-real-time. Three channels carry asynchronous updates from backend to frontend:

1. **Streaming chat responses.** Token-level streaming in the dashboard chat panel (and on the optional MCP surface). SSE is the assumed transport; WebSocket acceptable.
2. **Ingest pipeline progress.** When a paste enters the queue, the frontend reflects its state (queued → fetching → parsing → summarizing → indexed) via a soft toast and inline visual state on the item. No modal blocking.
3. **Filesystem watcher events.** When a shared shelf folder changes on disk (partner added an item, an external editor modified frontmatter), the dashboard updates within ≤ 2 s without a manual refresh.

Latency expectation: ≤ 500 ms from backend event to visible UI change on all three channels. Not sub-100 ms; this is not a game or a trading app.

### Not Applicable to This Project

Per project-type guidance, the following are skipped intentionally:

- **Native device features** (camera, GPS, push notifications) — no native runtime in MVP.
- **CLI commands** — the app is fully graphical in MVP; the CLI surface for plugin development is a developer concern documented in `AGENTS.md`, not a product feature.

## Scope & Roadmap

### MVP Strategy & Philosophy

**MVP type: Experience MVP.** The goal of the first release is to prove that the rediscovery-first value proposition feels real to a single user within five minutes of first open. This is not a platform MVP (no third-party integrations are a release gate), not a revenue MVP (no monetization), and not a scale MVP (a corpus of 500 items is sufficient to validate the experience). Decisions about what is "in" or "out" of MVP should be made against a single question: *does removing this break the rediscovery + chat + pre-seed experience for a first-time user?*

**Resource assumption:** the implementing team is effectively one person with AI-assisted engineering throughout, executing on a five-day build plan with a two-day buffer per the brainstorming's resource-constraints exercise. Scope is therefore aggressively bounded — any feature that does not map to one of the nine measurable outcomes is out of MVP by default.

**The five release-gating outcomes** (from the Measurable Outcomes table, condensed for scope anchoring):

1. Frictionless capture works end-to-end in ≤ 10 s.
2. Rediscovery search passes the gold-query regression suite (≥ 4/5).
3. Dashboard chat panel returns cited answers.
4. Custom Explore page renders the pre-seeded corpus with the design and motion bar defined in *Visual Polish & Motion Design*. Obsidian graph compatibility is a free byproduct of the `.md` + YAML-frontmatter storage model, not a separate release gate.
5. Pre-seed produces a working mini-wiki on first launch in ≤ 60 s.

If any of the five is at risk with 24 hours left in the build, the feature most disconnected from these outcomes is the first to be cut. The Explore page is **not** on the drop list — its visual and motion quality is part of the wow.

### Phase 1 — MVP Feature Set

In-scope for the initial release (15 items, derived directly from the brainstorming's distilled MVP list):

- Dashboard with paste/drop capture (idea #1)
- Hybrid search with rediscovery bias via QMD (idea #2)
- Compare and AI-Tool-Radar as chat templates (ideas #3, #6)
- Custom Explore page with 1 lens: topic clusters (idea #4)
- Topic Shelves as filesystem subfolders (idea #5)
- Shared Shelves via shared folder mechanism (idea #10)
- Basic Privacy Layer: `sensitivity` frontmatter field filtering QMD queries (idea #11)
- Chat with wiki — dashboard chat panel as primary surface; QMD MCP server exposed as optional secondary interface (idea #12)
- Search quality regression suite (idea #14)
- Interest Profile from corpus + rating (idea #15)
- Thumbs-up / thumbs-down feedback writing to frontmatter (idea #16)
- Onboarding pre-seed from curated sources (idea #18)
- AI auto-processing pipeline: TL;DR + related items (idea #20)
- Plugin-ready architecture (designed, not shipped with third-party plugins) (idea #21)
- `AGENTS.md` + self-indexing `!DOCS/` convention

Internal build order follows the brainstorming's 5-day plan: foundation → ingest & storage → AI processing & pre-seed → search & chat & feedback → viz, testing, self-indexing. No parallel streams; each day depends on the prior.

### Phase 2 — Growth (Post-MVP, Priority Order)

Deferred but designed-for. The ordering reflects both user value and dependency chains:

1. **Telegram bot ingest** — unlocks mobile/on-the-go capture without building a mobile app. Depends only on MVP ingest pipeline; first post-MVP feature to land.
2. **Auto-discovery crawler** — X / YouTube / news RSS feeding a weekly inbox. Depends on the rating/thumbs-up loop being proven in MVP (needed for relevance filtering).
3. **Contradiction highlighter on ingest** — shown as an inline card when a new item conflicts with stored claims. Depends on a matured LLM processing pipeline (stable TL;DR output, reliable related-item retrieval).
4. **Multi-lens Explore page** — time, contradiction, emotion lenses. Depends on the topic-lens implementation stabilizing.
5. **Per-shelf behavior** — AI shelf tool-comparison template, Recipes image-first, etc. Depends on the shelf model proving out in MVP.
6. **Additional LLM providers** — Ollama, Gemini, Groq, etc. via the Provider Protocol. Depends only on someone writing the adapter.
7. **Voice ingest** (mobile). Waits on the mobile surface.
8. **Mobile / PWA client with share-sheet.** Own sub-project.
9. **First real third-party plugins** — contributed Spotify, Kindle Highlights, etc. Requires the MVP plugin architecture to ship as designed.

### Phase 3 — Vision (Future)

Aspirational but unlikely in the first year:

- The wiki as a daily companion that surfaces a "weekly delight card" of rediscovered content
- Proactive contradiction negotiation ("you said X in 2025; this conflicts — reconcile?")
- Community plugin registry
- Export/publish flows: turn a shelf into a shareable micro-site
- Mobile native clients with offline-first sync

### Explicit Non-Goals

Out of scope now and likely forever:

- Multi-machine synchronization — delegated to the filesystem-sync service the user already runs (iCloud, Dropbox, Google Drive, Syncthing, git, etc.)
- Flashcard / Anki export
- Account system, authentication, hosted service — these would change the product's character away from local-first

### LLM Provider Abstraction

A single internal **LLM Provider Protocol** defines the operations the product needs from any model backend: `summarize(content)`, `embed(content)`, `chat_complete(messages, tools?)`, and `rerank(query, candidates)`. Any provider is pluggable through this protocol.

- **Shipped in MVP:** Anthropic Claude and OpenAI, both exposed as selectable providers in settings. User picks one; the app remembers the choice.
- **Post-MVP implementations (not blocking release):** Ollama (for local / offline), Gemini, Groq, anything else. Adding one is a matter of writing an adapter — no other part of the code changes.
- **No provider is hard-wired.** Even the pre-seed onboarding and the search-regression gold queries must work against any provider that conforms to the protocol. The protocol is tested independently.

### Storage & Sync Model

All data is stored as `.md` files with YAML frontmatter inside a user-configured folder on the local filesystem. The app watches that folder.

- **Single-user:** point the app at any folder you own. Default: `~/LatestNews/`.
- **Shared shelves:** each shared shelf is a sub-folder whose path the user configures explicitly. No assumption about what service (if any) syncs that folder. iCloud Drive, Dropbox, Google Drive, Syncthing, a git repo, a plain NAS mount — all work identically from the app's perspective. The filesystem watcher is the only integration point.
- **No sync logic in the app.** The app does not replicate, push, pull, or reconcile with any cloud service. Conflict resolution handles only filesystem-level artifacts (e.g. `*(conflicted copy)*` files appearing on disk); how those artifacts came to exist is outside the app's concern.

### Risk Mitigation Strategy

**Technical risks.**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Rediscovery rerank tuning takes longer than the 5-day build | Medium | High | Gold-query suite runs in advisory mode for MVP; tuning continues post-release until 4/5 is met. Release does not block on perfect tuning. |
| QMD or MCP spec behavior changes | Low | Medium | QMD integration wrapped behind a thin adapter; MCP surface is optional in MVP so a spec break cannot gate release. |
| Filesystem-watcher edge cases across user-chosen sync services | Medium | Medium | The app treats the configured folder as opaque — no knowledge of or dependency on any specific sync service. Conflict artifacts are handled generically. Users choose their sync service at their own risk. |
| LLM-provider cost, latency, or availability swings | Medium | Medium | The LLM Provider Protocol means the provider is a runtime choice, not a build-time dependency. A user switching from Claude to OpenAI (or to a future local provider) touches only settings. |
| Visual polish bar is met on paper but feels generic in practice | Medium | High | First-use video walkthrough recorded at end of day 5; reviewed by someone outside the project. If it does not feel "shipped consumer product," day-6/7 buffer is spent on polish, not features. |

**Market / adoption risks.**

| Risk | Mitigation |
|------|-----------|
| User gives up before the corpus is large enough for rediscovery to be valuable | Pre-seed onboarding ensures a non-empty starting state. First-week nudge: soft suggestion to paste 10 items over the first three days. |
| Value only emerges at high usage volume; early sessions feel unrewarding | The chat panel delivers value from day one even on a tiny corpus — a low-ceremony bridge until rediscovery has enough material to shine. |
| User does not trust a cloud LLM with personal reflections | `sensitivity: personal` is the default for new items. The Provider Protocol means a local-LLM alternative (Ollama) is a post-MVP swap, not a re-architecture — and is documented as a promised path. |

**Resource / schedule risks.**

| Risk | Mitigation |
|------|-----------|
| 5-day plan slips | Explicit drop-list: thumbs-up/down feedback loop (read-only acceptable for MVP), image OCR (store raw image), Telegram bot (already post-MVP), auto-discovery crawler (already post-MVP). Must-keep and never-drop: **dashboard chat panel, Explore page with polish, pre-seed onboarding, search regression suite**. |
| Polish demands eat the buffer | Buffer days (6–7) are nominally polish time. If polish is not sufficient, feedback-loop UI and non-essential settings pages slip before polish does. The feel of what ships matters more than the breadth of what ships. |
| Single-operator burnout | Aggressive scope discipline is the primary mitigation. AI-pair engineering is used throughout — `AGENTS.md` is operative from day one, not added at the end. |

## Functional Requirements

Each FR is a testable, implementation-agnostic capability. Every downstream artefact — UX design, architecture, epics, stories — traces back to this inventory. Anything not listed here will not exist in the product.

### Capture & Ingest

- **FR1:** User can paste one or more URLs into the capture input and submit them in a single action.
- **FR2:** User can drag and drop files (PDF, image, markdown) onto the capture surface for ingest.
- **FR3:** System can ingest content from URLs pointing to HTML pages, X posts, YouTube videos, PDF documents, and image files.
- **FR4:** Capture is non-blocking — the user can continue using the app while ingest runs asynchronously in the background.
- **FR5:** System provides visible per-item progress feedback during ingest (queued → fetching → parsing → summarizing → indexed).
- **FR6:** System handles ingest failures without data loss — failed items appear in an inbox / error state with the original URL preserved and a retry action.
- **FR7:** System can be extended to support additional content sources via drop-in plugins that conform to a documented interface, without modifications to the app core.

### AI Content Processing

- **FR8:** System automatically generates a concise summary (TL;DR) for each ingested item.
- **FR9:** System automatically suggests related existing items for each newly ingested item.
- **FR10:** System automatically suggests a shelf for each newly ingested item based on its content.
- **FR11:** User can override, replace, or regenerate any AI-generated field (summary, shelf, related items).
- **FR12:** All AI operations route through a pluggable LLM Provider Protocol. Claude and OpenAI are supported in MVP; additional providers can be added by implementing the protocol without touching any other part of the app.
- **FR13:** User can select and switch the active LLM provider at runtime; the change takes effect without application restart.

### Search & Retrieval

- **FR14:** User can issue a text query and receive ranked results across the entire searchable corpus.
- **FR15:** Search results combine lexical (BM25), semantic (vector), and LLM reranking signals, tuned to favor conceptual re-encounter of previously seen material.
- **FR16:** Search results display, for each hit, the item's title, source, shelf, date, and an excerpt containing the matched context.
- **FR17:** User can give thumbs-up or thumbs-down feedback on any item; the feedback is persisted to the item's frontmatter and influences future rank order.
- **FR18:** User can filter search results by shelf.
- **FR19:** User can open any search result to see the full item (markdown content, source link, related items, sensitivity, rating).

### Chat & Conversation

- **FR20:** User can ask natural-language questions in a dashboard chat panel and receive synthesized answers drawn only from their own corpus.
- **FR21:** Chat responses cite the source items used, and each citation links back to the underlying markdown file.
- **FR22:** Chat responses stream token-by-token as they are generated.
- **FR23:** System offers starter prompt templates for common use cases, including compare-items-in-a-shelf and detect-similar-to-this-new-item (the "AI Tool Radar" pattern).
- **FR24:** System exposes the same retrieval capability as an optional MCP server for use from external LLM clients (Claude Desktop, Cursor, etc.). The MCP surface is not required for MVP chat functionality.
- **FR25:** Chat answers respect sensitivity rules — items marked `personal` are excluded when queries originate from a context configured as shared or public.

### Exploration & Visualization

- **FR26:** User can open an Explore page that visualizes the corpus as a force-directed topic graph.
- **FR27:** User can hover, click, and drag nodes in the Explore graph; clicking a node opens the underlying item in a detail view.
- **FR28:** User can filter the Explore graph by shelf.
- **FR29:** The Explore graph animates state transitions (layout settling, filter changes, item addition) and honors `prefers-reduced-motion`.
- **FR30:** The underlying `.md` + YAML-frontmatter storage is fully compatible with Obsidian vault conventions without modification — opening the data root in Obsidian produces a usable graph and note browser without any export step.

### Shelves, Sensitivity & Multi-User

- **FR31:** User can organize items into shelves, each shelf represented as a subfolder of the data root.
- **FR32:** User can move an item between shelves and can delete an item from the corpus.
- **FR33:** Every item carries a sensitivity field (`personal`, `shared`, `publishable`) in its frontmatter, editable by the user and defaulting to `personal` for new items.
- **FR34:** User can configure one or more shared shelves by pointing the app at additional filesystem folder paths in settings.
- **FR35:** System detects filesystem-level conflict artefacts (e.g. `*(conflicted copy)*` files) in watched shelves and surfaces a resolution UI allowing the user to keep one version in a single click.
- **FR36:** System re-indexes and refreshes the UI when files in watched shelves change on disk, without requiring user action.

### Onboarding

- **FR37:** On first launch with an empty data root, system pre-seeds the corpus with a curated set of items from configured sources, producing a populated dashboard, Explore graph, and working search.
- **FR38:** User can dismiss or replace any pre-seeded item individually, or clear all pre-seeded content in a single action.
- **FR39:** Pre-seed content is clearly marked as such in the UI until the user explicitly keeps or removes it.

### Settings & Extensibility

- **FR40:** User can configure the data-root folder path and additional shared-shelf folder paths in settings.
- **FR41:** User can set the default sensitivity level applied to new items.
- **FR42:** User can toggle between light, dark, and system-preference themes; the chosen theme is persisted.
- **FR43:** The `AGENTS.md` file in the repository is authoritative documentation for how new features and ingest plugins are added, is kept accurate as a build-time norm, and is indexed by the product's own search so it is queryable alongside user content.
- **FR44:** The `!DOCS/` folder, including `AGENTS.md` and `!DOCS/CHANGELOG.md`, is indexed by the product's own search and returned in results when relevant to the user's query.

## Non-Functional Requirements

NFRs are selective. Only categories that actually constrain this product are documented below. Each requirement is testable.

### Performance

User-facing latency budgets. Measured on baseline developer hardware (M-series Mac or comparable). These are initial targets, subject to measurement during implementation.

- **NFR-P1:** End-to-end ingest (URL → searchable) completes in ≤ 10 s p95 at corpus size up to 500 items.
- **NFR-P2:** Search query returns ranked visible results in ≤ 500 ms p95 at corpus size up to 500 items.
- **NFR-P3:** Chat response produces first token within 3 s p95. Full streaming response completes at the rate the selected LLM provider supports, with no additional buffering on the app side.
- **NFR-P4:** App cold start reaches an interactive dashboard in ≤ 2 s p95, given a running local backend.
- **NFR-P5:** Filesystem change in a watched shelf propagates to the visible UI in ≤ 2 s p95.
- **NFR-P6:** Explore graph sustains ≥ 30 fps at 50 nodes and ≥ 20 fps at 200 nodes on baseline hardware.
- **NFR-P7:** Any regression of more than 25% against these targets on a previously-passing benchmark blocks release.
- **NFR-P8:** Dashboard render reaches first meaningful paint in ≤ 400 ms p95 when the SPA bundle is cached.

### Reliability & Data Integrity

Because the user's capture habit is "paste and forget," the system's durability contract must be stronger than a casual consumer app.

- **NFR-R1:** No paste or drop action results in silent data loss. If ingest fails, the original URL or file is preserved in an error-marked item that remains visible and retryable.
- **NFR-R2:** All persisted state is held in the user's filesystem as plain `.md` files with YAML frontmatter. No proprietary binary format, no lock-in database.
- **NFR-R3:** The application writes atomically — a crash during save cannot produce half-written markdown files. Temp-file-plus-rename or equivalent technique is required.
- **NFR-R4:** The index (BM25 + vector) is fully rebuildable from the markdown corpus. Loss of the index directory does not require user intervention beyond a one-command rebuild.
- **NFR-R5:** A plugin that throws or returns malformed output must not corrupt other items or crash the app. Plugin failures are isolated, logged to `!DOCS/plugin-errors/`, and the problematic item is quarantined.
- **NFR-R6:** The application is designed and tested to remain usable at corpus sizes up to 10 000 items. Beyond this is explicit post-MVP territory; the architecture should not silently degrade before then.

### Privacy & Security

This is a personal knowledge tool. The privacy posture matters more than the security posture (there is no multi-user attack surface, no server to harden).

- **NFR-S1:** The app opens no inbound network port accessible outside `localhost` by default.
- **NFR-S2:** All user data remains on the user's filesystem. The app initiates no outbound network traffic except (a) content fetches against URLs the user ingested, and (b) LLM provider calls against the user's configured provider.
- **NFR-S3:** The sensitivity rules defined in functional requirements (FR25, FR33) are enforced at the retrieval boundary, identically for both the dashboard chat panel and the optional MCP surface. A `sensitivity: personal` item can never surface via a request originating from a context the user configured as shared or public.
- **NFR-S4:** The LLM provider selected by the user is visible and changeable at any time. When a cloud provider (Claude, OpenAI) is selected, the app must clearly indicate that content being processed is sent to that provider.
- **NFR-S5:** No telemetry or usage analytics leaves the user's machine without explicit opt-in. Default is opt-out, fully.
- **NFR-S6:** Frontmatter-stored secrets (e.g. API keys in settings) are kept outside the ingested corpus and excluded from search and chat contexts.

### Accessibility

Target: **WCAG 2.1 AA** across all user-facing surfaces. Accessibility detail for the web application is enumerated in *Web Application Specific Requirements › Accessibility Level*; the quality-attribute commitments here:

- **NFR-A1:** All primary actions (capture, search, open chat, navigate the Explore graph, thumbs-up/down, open item, delete item, switch shelf) are reachable and operable from the keyboard alone.
- **NFR-A2:** All text meets a 4.5:1 contrast ratio against its background in both light and dark themes.
- **NFR-A3:** All icon-only controls carry accessible labels. Dynamic content updates (ingest progress, chat tokens, conflict notifications) are announced via ARIA live regions or equivalent.
- **NFR-A4:** `prefers-reduced-motion` is honored across all animated surfaces (ingest transitions, Explore graph, chat streaming, search results) without losing informational content.
- **NFR-A5:** The app passes automated accessibility linting (axe-core, Lighthouse a11y) with zero errors on all shipped routes.

### Integration

- **NFR-I1:** The LLM Provider Protocol is the sole integration point between the app and any LLM backend. Adding a new provider requires no changes outside a single adapter module.
- **NFR-I2:** The MCP surface conforms to the current MCP specification and is wrapped behind an adapter; a spec revision must not require changes outside the adapter.
- **NFR-I3:** The filesystem watcher is opaque to the sync service being used. iCloud Drive, Dropbox, Google Drive, Syncthing, git-annex, a plain local folder, or a network-mounted share must all work without service-specific code paths.
- **NFR-I4:** Obsidian compatibility is achieved by conforming to Obsidian's vault conventions (standard markdown with optional YAML frontmatter, reasonable folder structure, `[[wiki links]]` preserved). No Obsidian-specific plugin, configuration, or metadata file is written by the app.

### Maintainability & Engineering Quality

The internal engineering bar is explicit. "Reference-grade" is a commitment, not a label — it has measurable consequences.

- **NFR-Q1:** A search-quality regression suite runs on every commit against a fixed gold dataset. Results are recorded and made available to reviewers. Regressions below the passing threshold block merge once the threshold is promoted to blocking (see *Scope & Roadmap › Risk Mitigation Strategy*).
- **NFR-Q2:** Unit and integration test coverage is measured and reported. No numeric threshold is mandated for MVP, but coverage must not drop between consecutive commits on the main branch.
- **NFR-Q3:** The plugin interface contract is documented, typed, and independently testable. Any conformant plugin works; any non-conformant plugin is rejected at load time with a clear error.
- **NFR-Q4:** `AGENTS.md` is treated as production documentation. It is kept current with the codebase — a PR that changes the extension surface without updating `AGENTS.md` fails review.
- **NFR-Q5:** The `!DOCS/` folder is self-indexing: product features, changelog entries, and agent guidance are all retrievable through the product's own search. A query like *"how do I add a new ingest plugin?"* returns `AGENTS.md` content in the top results.
- **NFR-Q6:** Every commit is attributable to either a story in `!DOCS/planning-artifacts/stories.md` or an explicit maintenance ticket. No "various fixes" commits on the main branch.

### Visual Polish & Motion Quality

The visual and motion bar is enumerated in detail in *Web Application Specific Requirements › Visual Polish & Motion Design*. NFR-level commitments:

- **NFR-V1:** Every released surface conforms to the tokenized design system — no raw hex colors, ad-hoc spacing values, or one-off shadows in component source.
- **NFR-V2:** Every meaningful state transition (hover, focus, press, load, enter, exit, filter change, graph settle) has an explicitly designed animation that sustains 60 fps on baseline hardware.
- **NFR-V3:** On first use, a reviewer unfamiliar with the project must judge the product to be at the quality level of shipped consumer SaaS (Linear, Raycast, Arc, Superhuman) before release. This judgment is recorded as a qualitative release gate alongside the Measurable Outcomes table.

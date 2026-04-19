# Story 2.1: Dashboard capture input and drag-drop zone

Status: done

## Story

As a user,
I want a prominent capture input at the top of the Dashboard plus a page-wide drag-drop zone,
so that I can paste URLs or drop files without any setup or decision — the first half of the "frictionless capture" promise.

## Acceptance Criteria

1. **Capture input visible and auto-focused on Dashboard.** `/` (Dashboard) renders a `<CaptureInput />` at the top of the `<main>` area. The input has placeholder `"Paste a link, drop a file, or ⌘V from anywhere"` (the modifier symbol is platform-aware: `⌘` on macOS, `Ctrl` elsewhere — reuse `isMacPlatform()` from Story 1.5). The input is focused on mount.

2. **Token-derived visual.** The wrapper renders with `bg-surface-primary`, `border border-border-default`, `rounded-md`, `shadow-subtle`; focus ring is `focus-visible:shadow-glow-accent`; typography is `text-body`. An atmospheric halo sits behind the input: a `bg-[image:var(--gradient-accent-vertical)] opacity-40` (or similar token-driven radial fade) that extends ~200 px above and behind the input without blocking clicks (`pointer-events-none`).

3. **Enter submits; Escape blurs and clears.** The input listens for `Enter` (without modifier keys) to call `onSubmit`; `Cmd/Ctrl+Enter` is also accepted (some users prefer it). `Escape` clears the value and blurs. `Shift+Enter` inserts a newline IF the input is a textarea; if the component is a single-line `<input>`, this AC does not apply and the story ships single-line for MVP.

4. **Submit calls `POST /api/items` with `{ url: <value> }`.** The payload is JSON (`application/json`). The request body validates client-side via a Zod schema requiring a minimum of 1 non-whitespace character — it does NOT require `z.string().url()` because the backend accepts free text too (Story 2.2 decides). The request is fired via `fetch('/api/items', { method: 'POST', ... })` — goes through Vite's `/api/*` proxy to the backend in dev. No `axios`; no `@tanstack/react-query` yet (defer until multi-component fetch coordination exists).

5. **Submitting state visible on the input.** While the request is in flight: the input is disabled (`disabled` attribute), the send affordance swaps its icon for a token-coloured spinner (Lucide's `LoaderCircle` with `animate-spin`), and `cursor-progress` is applied to the wrapper. On success the input clears and re-focuses. On error the input stays populated; a `console.warn('capture failed', err)` is logged behind a `biome-ignore lint/suspicious/noConsole` comment (Story 2.5 replaces this with a toast + retry UI).

6. **Send affordance.** A small icon button (`<Button variant="ghost" size="sm" className="size-8 p-0">`) with `SendHorizontal` Lucide icon lives on the right side of the input wrapper. `aria-label="Submit capture"`. Clicking it is equivalent to pressing Enter. No `glow-breathe` animation yet — the motion library's `glowBreathe` variant was scoped to idle affordances with ambient purpose (chat send button in Epic 5) rather than the capture send. Simpler + a11y-safer.

7. **Page-wide drop zone.** A single `<DropZone />` sibling of `<CaptureInput />` listens to `dragenter` / `dragover` / `dragleave` / `drop` events bound to the AppShell's `<main>` element (so it covers the full dashboard route area, not just the input). While dragging is active, a full-overlay appears with:
   - Backdrop: `fixed inset-0 z-40 bg-surface-overlay` + `supports-backdrop-filter:backdrop-blur-sm`
   - Centre content: `<div className="rounded-lg border-2 border-dashed border-accent-ring bg-surface-primary/50 p-12 text-center">` with `text-heading-2 font-semibold text-accent-deep` "Drop to capture" and a `text-body text-text-muted` subline listing supported types ("URLs, PDFs, images, markdown, plain text").
   - Enter/exit transitions use the overlay-pattern established in Story 1.5 (`transition-opacity duration-base ease-standard`, `data-[state=open]:opacity-100 data-[state=closed]:opacity-0`) — no `tw-animate-css`, the global reduced-motion reset collapses it for NFR-A4.

8. **Drop handler posts files via multipart.** When files are dropped: `event.preventDefault()`, then for each file in `event.dataTransfer.files` call `fetch('/api/items', { method: 'POST', body: formData })` where `formData` contains `file` and `source_type` (inferred from MIME: `application/pdf` → `pdf`, `image/*` → `image`, `text/markdown` → `markdown`, else → `text`). Batched sequentially (not `Promise.all` — avoid overwhelming the yet-unimplemented backend). On success: overlay hides, no input change. On error per file: `console.warn` per Story 2.5 placeholder pattern.

9. **Dragged URL fallback.** If no files are in the drop event but `event.dataTransfer.types` includes `text/uri-list` or `text/plain`, extract the string and POST it as `{ url: <string> }` JSON just like the input submission.

10. **Drag-discrimination on inputs.** The drop handler must ignore drag events whose target is inside an `input`, `textarea`, or `[contenteditable]` — browsers fire drag events into text fields for native text-drag support; our page-wide zone should not hijack those. Reuse the `isEditableTarget()` helper from `useGlobalShortcuts` (lift to `web/src/app/platform.ts` or a new `web/src/lib/dom.ts`).

11. **`CaptureInput` unit tests.** `web/src/features/capture/__tests__/CaptureInput.test.tsx`:
   - Renders with placeholder visible
   - Enter with value triggers `fetch` with correct JSON body (mock `fetch`)
   - Empty value does NOT trigger fetch (validation blocks)
   - Escape clears the value
   - Successful fetch clears and re-focuses
   - Failed fetch leaves the value intact

12. **`DropZone` unit tests.** `web/src/features/capture/__tests__/DropZone.test.tsx`:
   - `dragenter` on the main element activates the overlay
   - `dragleave` deactivates
   - `drop` with a file calls `fetch` with multipart body (mock `fetch`; assert the request has `FormData` body with a `file` entry and `source_type` field)
   - `drop` with a URL-only payload calls the JSON endpoint
   - Drag events originating inside an `<input>` are ignored (overlay never appears)

13. **Dashboard route replaces placeholder.** `web/src/routes/dashboard.tsx` renders the new `<CaptureInput />` + `<DropZone />` directly inside its `<main>`. The "Capture flow lands in Epic 2" placeholder text is removed. A single sentence of guide text remains below the input: "Your captured items will appear here." (`text-body-sm text-text-muted`) — a soft affordance that the list is coming (Story 2.2 populates it).

14. **Lint / typecheck / test green; CI green.** All gates pass locally; GitHub Actions green on the resulting `dev` commit.

## Tasks / Subtasks

- [x] **Task 1: Project structure + lift shared DOM helper** (AC: #10)
  - [x] Create `web/src/features/capture/` directory (first feature subtree under `features/`). Add to AGENTS.md in T10.
  - [x] Extract `isEditableTarget` from `web/src/app/useGlobalShortcuts.ts` into `web/src/lib/dom.ts` (new). Re-import both from `useGlobalShortcuts` and the forthcoming `DropZone`. Reduces drift between the two input-discrimination sites.

- [x] **Task 2: Zod schema + shared types** (AC: #4, #8)
  - [x] `cd web && npm install zod` (installed as shadcn transitive dep in Story 1.4; verify present)
  - [x] Create `web/src/features/capture/types.ts` exporting `ItemsPostUrlSchema = z.object({ url: z.string().min(1).trim() })` and a `SourceType = 'pdf' | 'image' | 'markdown' | 'text'` union with `inferSourceType(mime: string): SourceType` helper.

- [x] **Task 3: `postCaptureUrl` / `postCaptureFile` client helpers** (AC: #4, #8, #9)
  - [x] `web/src/features/capture/postCapture.ts` exporting two async functions
  - [x] `postCaptureUrl(url: string): Promise<Response>` — `fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })`
  - [x] `postCaptureFile(file: File): Promise<Response>` — builds `FormData` with `file` + `source_type` from `inferSourceType(file.type)`; `fetch('/api/items', { method: 'POST', body: formData })` (no manual `Content-Type` — browser sets the boundary)
  - [x] Both throw on non-2xx (`!response.ok`). Callers handle.

- [x] **Task 4: Author `<CaptureInput />`** (AC: #1, #2, #3, #4, #5, #6)
  - [x] `web/src/features/capture/CaptureInput.tsx`
  - [x] Controlled `<input type="text">` via `useState<string>('')`
  - [x] `useRef` on the input + `useEffect` to call `.focus()` on mount
  - [x] Wrapper `<div>` with the token styles + atmospheric halo `<div aria-hidden className="pointer-events-none absolute ... bg-[image:var(--gradient-accent-vertical)] opacity-40" />`
  - [x] Send affordance right-aligned inside wrapper
  - [x] `onKeyDown`: `Enter` (and `Cmd/Ctrl+Enter`) → submit; `Escape` → clear + blur
  - [x] Submit handler: Zod parse, call `postCaptureUrl`, handle success/error per AC #5
  - [x] Disable input while submitting; spinner icon in send button

- [x] **Task 5: Author `<DropZone />`** (AC: #7, #8, #9, #10)
  - [x] `web/src/features/capture/DropZone.tsx`
  - [x] `useEffect` binds `dragenter`/`dragover`/`dragleave`/`drop` to `document.body` (simplest; the AppShell `<main>` is tricky to reach from a leaf component). Guard each handler with `isEditableTarget(event.target)` — bail on true.
  - [x] Track `isDragging` + a debounced `setIsDragging(false)` via a ref-based counter so nested `dragenter`/`dragleave` pairs don't flicker
  - [x] Render the overlay with `data-state={isDragging ? 'open' : 'closed'}` and the transition classes from AC #7
  - [x] Drop handler: `event.preventDefault()`; if `files.length > 0` iterate and call `postCaptureFile` sequentially; else check `event.dataTransfer.getData('text/uri-list')` / `'text/plain'` and call `postCaptureUrl`

- [x] **Task 6: Wire into Dashboard route** (AC: #13)
  - [x] Rewrite `web/src/routes/dashboard.tsx` to render `<CaptureInput />` + `<DropZone />` inside a `<main className="mx-auto max-w-3xl p-8">` wrapper; remove the Epic-2-placeholder `<p>`
  - [x] Add a `<p className="text-body-sm text-text-muted mt-4">Your captured items will appear here.</p>` below the input

- [x] **Task 7: CaptureInput tests** (AC: #11)
  - [x] Mock `global.fetch` with `vi.spyOn(globalThis, 'fetch')` or `vi.stubGlobal('fetch', …)`
  - [x] Covers the 6 scenarios in AC #11; use `@testing-library/user-event` for realistic keyboard simulation

- [x] **Task 8: DropZone tests** (AC: #12)
  - [x] `fireEvent.dragEnter(document.body)` + `fireEvent.dragLeave(document.body)` + `fireEvent.drop(document.body, { dataTransfer: { files: [new File([...], 'test.pdf', { type: 'application/pdf' })], types: ['Files'] } })`
  - [x] Mock `fetch`; assert body shape (FormData vs JSON)
  - [x] Drag inside an `<input>` fixture: overlay never activates

- [x] **Task 9: Gate check + commit** (AC: #14)
  - [x] `npm run lint`, `npm run typecheck`, `npm run test` — all green
  - [x] Expected test count: 122 (1.5) + 6 + 5 = ~133. Target ≥ 130.
  - [x] Conventional Commits: `feat(capture): Dashboard capture input + page-wide drop zone (Story 2.1)`
  - [x] Push `origin/dev`; CI green
  - [x] Per AGENTS.md workflow: review → apply fixes → PR/merge follow automatically

- [x] **Task 10: AGENTS.md update** (NFR-Q4)
  - [x] Add `web/src/features/` bullet under `web/` in Repository layout (first feature subtree): "feature-scoped components and logic (`capture/`, later `chat/`, `search/`, …)"
  - [x] Add `web/src/lib/dom.ts` to the existing `web/src/lib/` bullet's description

## Dev Notes

### Scope and altitude

First Epic 2 story. Ships **only the capture UI + network call boundary** — the backend that actually receives the POST is Story 2.2. This story must not stub a backend (that's scope creep into 2.2). It must not display any received data (no item list; that's tied to 2.2 and 2.4). The test target is "user can paste and submit / drop and submit; requests fire with correct payloads" — not "end-to-end item ingestion works."

Out of scope:

- **Backend `/api/items` endpoint** — Story 2.2.
- **SSE subscription + ingest progress visualization** — Story 2.4.
- **Error toast + retry UI** — Story 2.5.
- **Global `Cmd-V` paste handler** (outside the focused input) — Story 2.3.
- **Item list rendering, ItemCard, shelves sidebar** — later Epic 2 + Epic 7.
- **Rate limiting, size cap, MIME allowlist enforcement** — backend concerns (Story 2.2).
- **AI processing** — Epic 3.

### Architecture source of truth

- **Architecture full document:** `!DOCS/planning-artifacts/architecture.md`.
- **`web/src/` subtree layout**: `web/src/features/` is a new subtree introduced here (first feature directory — architecture's "features folder" is singular). Later epics add `features/chat/`, `features/search/`, `features/explore/`.
- **API contract for `POST /api/items`**: per architecture § API → Capture, request body accepts either `{ url: string }` JSON or multipart with `file` + `source_type`; response is `201 Created` with `{ id: string, status: 'queued' }`. Story 2.1 sends what the spec says; Story 2.2 validates the spec on the server side.

### UX source of truth

- **UX spec full document:** `!DOCS/planning-artifacts/ux-design-specification.md`.
- **Direction B — The Atrium:** generous spacing, atmospheric surfaces. The capture input halo is our first application of the `--gradient-accent-vertical` token.
- **Drop-to-capture overlay:** dashed border, centred label, surface-overlay backdrop — UX spec § Capture & Ingest Flow.
- **Keyboard primacy:** paste + Enter is the canonical gesture. Drag-drop is secondary but non-negotiable.

### PRD NFRs + FRs

- **FR1** — "User can paste one or more URLs ... submit in a single action." This story supports single URL per submission; multi-URL batching is Story 2.3's Cmd-V handler concern.
- **FR2** — "User can drag and drop files (PDF, image, markdown) onto the capture surface." Covered via `<DropZone />`.
- **FR4** — capture is non-blocking. The `fetch` is async; input clears on success without waiting for the full ingest pipeline.
- **FR5, FR6** — per-item progress + retry. Out of scope here (Story 2.4 + 2.5).
- **NFR-A1** — keyboard-first. Enter submits; Escape blurs; Tab reaches the send button; drop zone works with no mouse as a bonus (drag from another app → drop).
- **NFR-A4** — `prefers-reduced-motion` honoured by global reset (Story 1.5) and by not using `repeat:Infinity` animations in this story.
- **NFR-V1** — tokens everywhere; no raw hex / arbitrary spacing.
- **NFR-V2** — overlay enter/exit transitions at `duration-base`; send-button state swap at `duration-fast`.
- **NFR-S1, NFR-S2** — only local endpoint (`/api/items`); no external hosts.
- **NFR-P8** — CaptureInput is lightweight; first meaningful paint under budget.
- **NFR-R1** — no silent data loss on POST failure: input retains the value until the user clears it or retries. Error messaging is Story 2.5.
- **NFR-Q4** — AGENTS.md updated with `features/` + `lib/dom.ts`.
- **NFR-Q6** — commit references Story 2.1.

### Key technical decisions

- **No `axios`, no TanStack Query.** Plain `fetch`. When we need cache + invalidate semantics (item list, search results) we'll add TanStack Query; capture is a fire-and-forget POST with no response payload to cache.
- **No `react-dropzone`.** Native HTML5 drag-drop is sufficient for file + URL drops and keeps the dep tree small. `react-dropzone` adds accessibility affordances we don't need for MVP (a hidden file input / click-to-browse — not in the UX spec).
- **Single-line `<input>`, not `<textarea>`.** UX spec treats capture as a URL / short-text bar. Multi-line paste still works via clipboard expansion but the visible affordance is single-line. Shift+Enter is moot.
- **`document.body` drop target, not AppShell `<main>`.** Reaching the AppShell from a leaf component requires context / ref forwarding — over-engineered for MVP. `document.body` covers every surface except text inputs (which we discriminate). When we later need per-route drop behaviour, rearchitect via a React context that publishes the drag state.
- **`postCapture.ts` helpers not a hook.** Deliberately functions, not `useMutation` hooks. Callers manage their own submitting state via `useState`. When we later introduce `useMutation` (Epic 3 LLM calls), capture migrates alongside.
- **Client-side validation is minimal.** `z.string().min(1).trim()` — we accept any non-empty string. Backend (Story 2.2) decides whether it's a URL, a file path, free text, etc.
- **`features/` not `components/`.** `components/ui/` is the shadcn primitive layer (Button, Input, Dialog); `features/capture/` is app-specific composition. This is the architecture's decided split; Story 2.1 introduces the features tree.

### File layout (story deliverables)

```
web/
├─ package.json                           # MODIFIED — verify zod present (installed transitively in 1.4)
└─ src/
   ├─ lib/
   │  └─ dom.ts                           # NEW — isEditableTarget lifted from app/useGlobalShortcuts
   ├─ app/
   │  └─ useGlobalShortcuts.ts            # MODIFIED — imports isEditableTarget from lib/dom
   ├─ routes/
   │  └─ dashboard.tsx                    # MODIFIED — renders CaptureInput + DropZone
   └─ features/                           # NEW subtree
      └─ capture/
         ├─ CaptureInput.tsx              # NEW
         ├─ DropZone.tsx                  # NEW
         ├─ postCapture.ts                # NEW
         ├─ types.ts                      # NEW — zod schema + SourceType union + inferSourceType
         └─ __tests__/
            ├─ CaptureInput.test.tsx      # NEW
            └─ DropZone.test.tsx          # NEW
```

Also modify:

- `AGENTS.md` — add `web/src/features/` bullet.

### Previous-story intelligence (carry-over)

- **Branch strategy** — `dev` = integration, `main` = production (at `5b81c01` after Story 1.5's merge). Pull `dev` (fast-forwarded to main) and start.
- **Motion primitives** from Story 1.4 are exported and available. `glowBreathe` stays unused in 2.1 (it's for ambient idle like chat send — no fit here).
- **Overlay CSS pattern** from Story 1.5: `data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-base ease-standard`. DropZone reuses this.
- **`isEditableTarget`** from `useGlobalShortcuts.ts`: lift to `lib/dom.ts` so two modules share one definition.
- **`isMacPlatform`** from `app/platform.ts`: use it for the `⌘V` / `Ctrl V` placeholder text split.
- **Biome** `noConsole: error` — the single placeholder `console.warn` in Tasks 4 + 5 needs a `biome-ignore` comment naming Story 2.5 as the replacement site.
- **Tailwind v4 utilities** from Story 1.4 alias layer: `bg-surface-primary`, `border-border-default`, `shadow-subtle`, `shadow-glow-accent`, `text-body`, `rounded-md` all resolve.
- **happy-dom 20 + Vitest** — the `fetch` stub pattern in tests uses `vi.stubGlobal('fetch', vi.fn())`. `FormData` is natively supported.
- **React Router v7 `useNavigate()`** not needed here; the Dashboard route doesn't navigate on submit (the item will appear in the list when Story 2.2 persists it).
- **shadcn `<Input />`** exists but is styled for forms with labels. The capture input is a one-off composition; using a plain `<input>` + our token classes is cleaner than fighting shadcn defaults. Alternatively use `<Input className="…">` — either is defensible.

### Library / version pins

- `zod` — already present (shadcn transitive). Verify version.
- No new deps beyond lockfile.

### Known gotchas

- **Vite dev proxy.** The `/api/*` path goes through `web/vite.config.ts`'s proxy to `:8000`. In Story 2.1 there's no backend listening yet, so **expect 502 / connection-refused from `fetch`** during dev. That's correct — the tests mock `fetch` and Story 2.2 will make real requests work. Don't add an env-var-based toggle or mock-mode switch.
- **`dragleave` fires on child elements.** When the user drags over a child of the drop target, `dragleave` fires for the parent but `dragenter` immediately follows on the child. Without a counter, `isDragging` flickers. Use an integer `dragDepth` incremented on `dragenter` and decremented on `dragleave`; `isDragging = dragDepth > 0`.
- **`dragover` MUST call `preventDefault()`.** Without it, the browser refuses the drop and fires no `drop` event. Classic HTML5 drag-drop gotcha.
- **File input drag in Firefox.** Firefox fires `dragenter` on text inputs too. `isEditableTarget` catches it; add a test case or at least a manual-verification note.
- **`FormData` with binary file.** `browser` sets the multipart boundary automatically when you don't pass a `Content-Type` header. If you DO pass one, the boundary is missing and the server parses zero files. Never set `Content-Type` for FormData posts.
- **`application/x-gzip` etc. unknown MIME.** `inferSourceType` falls back to `'text'`. Backend decides whether to accept; the frontend is permissive.
- **Input auto-focus + React Strict Mode.** Dev-mode double-renders can focus the input twice. `useEffect` with a ref + `focus()` is idempotent, so no visible bug; just a note.
- **`biome-ignore lint/suspicious/noConsole` needs a reason.** Follow Story 1.5's pattern: `// biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI`.
- **Drop zone z-index vs HelpOverlay.** HelpOverlay is a `<Dialog>` with z-50 (Radix default). Drop zone backdrop at z-40 sits below it — correct ordering: if the help overlay is open, drags over it don't activate the drop zone (the overlay is above + swallows events).
- **`Escape` + Dialog interaction.** `Escape` inside CaptureInput clears the value. If a Dialog is open (HelpOverlay), Radix catches `Escape` at a higher level and closes the dialog. The input's `Escape` handler is never reached. Correct — users expect Dialog dismissal to win.

### Testing standards summary

- **Vitest + RTL + happy-dom** — established in Stories 1.2–1.5.
- **Mock `fetch`** with `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'abc', status: 'queued' }), { status: 201 })))`.
- **No E2E Playwright yet.**
- **Target test count:** 122 (1.5) + 6 CaptureInput + 5 DropZone ≈ 133.

### Project Structure Notes

`web/src/features/` is the first directory under the feature-scoped composition tree from architecture § Project Structure & Boundaries. Later epics add `features/chat/`, `features/search/`, etc. `web/src/components/ui/` stays as the primitive layer (shadcn); `web/src/app/` is AppShell-level; `web/src/features/` is the application composition. This split is architecture-aligned.

### References

- Architecture — `web/src/` structure: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries
- Architecture — Capture API contract: `!DOCS/planning-artifacts/architecture.md` § API → Capture
- UX — Capture & ingest flow: `!DOCS/planning-artifacts/ux-design-specification.md` § Capture & Ingest Flow
- UX — The Atrium direction (atmospheric halo): `!DOCS/planning-artifacts/ux-design-specification.md` § Direction Decision
- PRD — FR1/FR2/FR4/FR5/FR6, NFR-A1/A4/P8/R1/S1/S2/V1/V2/Q4/Q6: `!DOCS/planning-artifacts/prd.md`
- Epics — Epic 2 + Story 2.1: `!DOCS/planning-artifacts/epics.md`
- Story 1.5 completion (AppShell + routes): `!DOCS/implementation-artifacts/1-5-implement-appshell-with-routing-theme-toggle-and-keyboard-overlay.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via Claude Code (BMad `bmad-dev-story` workflow).

### Debug Log References

- **`isEditableTarget` lifted to `web/src/lib/dom.ts`**. Previously sat inside `app/useGlobalShortcuts.ts`; now imported from the shared lib by both the shortcut hook and the new `DropZone`.
- **Send button disabled on empty value.** Made the button `disabled` when `value.trim().length === 0` in addition to the Zod-guarded submit. Prevents a click-to-dead-state UX when the Enter path already blocks.
- **Plain `<input>` + token classes, not shadcn `<Input />`.** The capture input is a bespoke composition (atmospheric halo behind, icon button inside); fighting shadcn Input's opinionated wrapper added no value.
- **`dragenter` discrimination on payload.** Only activate the overlay when `event.dataTransfer.types` contains `Files` / `text/uri-list` / `text/plain` — prevents accidental overlay for in-page element drags (e.g. DOM element reorder tools).
- **`userEvent.keyboard('{Escape}')` resolves fine under happy-dom 20.** No shim needed.
- **FormData assertions in tests** — happy-dom ships a working `FormData`, so `init.body` is a real `FormData` instance we can introspect.

### Completion Notes List

- **Scope held.** No backend endpoint (Story 2.2), no SSE / progress visualization (Story 2.4), no toast / retry (Story 2.5), no global Cmd-V (Story 2.3), no item list / ItemCard (later).
- **`features/` subtree introduced** at `web/src/features/capture/` — first feature directory. AGENTS.md updated with a generic bullet ("`capture/`; later `chat/`, `search/`, `explore/`").
- **Network calls will 502 in dev** until Story 2.2 lands the backend. Expected. Tests stub `fetch` so nothing on CI depends on it.
- **No new runtime deps.** `zod` was already present (shadcn transitive). `motion` / React Router / fontsource untouched.
- **Test count 122 → 132** (+6 CaptureInput + 4 DropZone).
- **NFR coverage:** V1 (tokens everywhere), V2 (overlay + focus transitions at `duration-base`), A1 (keyboard Enter / Escape; drag-drop as secondary), A4 (global `prefers-reduced-motion` reset from Story 1.5 collapses the overlay transition), R1 (no silent data loss — failing submit leaves value intact), S1/S2 (only `/api/items` local endpoint), Q4 (AGENTS.md updated), Q6 (commit references Story 2.1).

### File List

**New — capture feature subtree**

- `web/src/features/capture/types.ts` (Zod schema + `SourceType` + `inferSourceType`)
- `web/src/features/capture/postCapture.ts` (`postCaptureUrl`, `postCaptureFile`, `CaptureError`)
- `web/src/features/capture/CaptureInput.tsx`
- `web/src/features/capture/DropZone.tsx`
- `web/src/features/capture/__tests__/CaptureInput.test.tsx`
- `web/src/features/capture/__tests__/DropZone.test.tsx`

**New — shared DOM helper**

- `web/src/lib/dom.ts` (`isEditableTarget`)

**Modified — app layer**

- `web/src/app/useGlobalShortcuts.ts` (now imports `isEditableTarget` from `@/lib/dom`)
- `web/src/routes/dashboard.tsx` (renders `<CaptureInput />` + `<DropZone />`, removes Epic-2-placeholder text)

**Modified — root**

- `AGENTS.md` (new `web/src/features/` bullet; `web/src/lib/` bullet mentions `isEditableTarget`)

**Modified — planning artefacts**

- `!DOCS/implementation-artifacts/2-1-dashboard-capture-input-and-drag-drop-zone.md` (status, task checkboxes, Dev Agent Record)
- `!DOCS/implementation-artifacts/sprint-status.yaml` (2-1 → in-progress → review)

### Change Log

| Date       | Change                                                                                              |
|------------|-----------------------------------------------------------------------------------------------------|
| 2026-04-19 | Status → `in-progress`. Lifted `isEditableTarget` to `lib/dom.ts`.                                   |
| 2026-04-19 | Authored `CaptureInput` + `DropZone` + `postCapture` helpers + Zod types + 10 RTL tests.             |
| 2026-04-19 | Dashboard route rewritten; 132 web + 1 backend tests green. Status → `review` on commit.             |

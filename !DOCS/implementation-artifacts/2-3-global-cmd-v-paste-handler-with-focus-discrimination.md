# Story 2.3: Global Cmd-V paste handler with focus discrimination

Status: ready-for-dev

## Story

As a user,
I want to capture by pressing ⌘V / Ctrl+V from anywhere in the app — except when I'm typing in a text field —
so that capture is always one keystroke away, no matter where my focus happens to be.

## Acceptance Criteria

1. **Global paste handler mounted on `document`.** `web/src/app/useGlobalPasteHandler.ts` exports a hook that binds a single `paste` event listener to `document` via `useEffect` and cleans up on unmount. Bound once at the AppShell level (sibling of `useGlobalShortcuts`). No per-route duplication.

2. **Focus discrimination uses the shared helper.** The handler bails early via `isEditableTarget(event.target)` from `web/src/lib/dom.ts` (Story 2.1). Paste inside an `<input>`, `<textarea>`, `<select>`, or `[contenteditable]` falls through to native paste — the global handler must not call `preventDefault`. Every other target (divs, buttons, body) triggers global capture.

3. **Clipboard text → POST `/api/items`.** When the global path fires, `event.preventDefault()` is called (no double paste into a random element), then `event.clipboardData.getData('text/plain')` is read. If the string is non-empty after `trim()`, it is sent via the existing `postCaptureUrl(text)` helper from `web/src/features/capture/postCapture.ts`. URL vs free-text distinction is the backend's problem (Story 2.2 accepts either shape) — the frontend is permissive.

4. **Empty clipboard is a silent no-op.** If `clipboardData` is null, or `text/plain` is empty/whitespace after trim, the handler does nothing. No toast, no console noise — the user's keystroke simply fell on a dry source.

5. **Success toast.** On a successful POST (2xx), `sonner.toast.success("Captured")` fires — no body text, no icon override beyond Sonner's default. Toasts stack at bottom-right (Sonner's default position, confirmed by Story 1.5's `<Toaster closeButton toastOptions={{ duration: DURATION_BASE }} />` in AppShell). Duration per AC: 2 seconds. Because `DURATION_BASE = 220ms` is the global animation token, we use an explicit `duration: 2000` on this specific toast call.

6. **Failure is a logged warning, not a toast.** On non-2xx or network error: a single `console.warn("paste capture failed", err)` behind a `biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI` comment. Mirrors the placeholder pattern from `CaptureInput` / `DropZone` (Story 2.1). Retry + user-facing error UI is **Story 2.5's concern**.

7. **Images and non-text clipboard content: out of scope for 2.3.** If the clipboard carries `image/*` (e.g., screenshot paste) and no usable text, the handler is a silent no-op. A code comment names Story 2.5 or a later story as the place where image-paste is wired via `postCaptureFile`. Do not stub a half-implementation.

8. **AppShell wires the hook.** `web/src/app/AppShell.tsx` calls `useGlobalPasteHandler()` alongside `useGlobalShortcuts({...})`. Pasteworks on every route (`/`, `/explore`, `/settings`) because AppShell is the layout route.

9. **Unit tests.** `web/src/app/__tests__/useGlobalPasteHandler.test.tsx` or `.test.ts`:
   - Paste on `document.body` with `text/plain` → `postCaptureUrl` called with the trimmed text.
   - Paste on a `<input>` → `postCaptureUrl` NOT called; native paste proceeds (we can't easily assert "native paste happened" in happy-dom — assert `event.defaultPrevented === false`).
   - Paste with empty clipboard → no fetch, no toast.
   - Paste with whitespace-only clipboard → no fetch, no toast.
   - Successful fetch → `toast.success` is called (spy on `sonner` module).
   - Failed fetch → `console.warn` is called; `toast.success` is NOT.
   - `isEditableTarget` returns true for a `[contenteditable]` div → global handler bails.

10. **Placeholder text preserves the `⌘V` hint.** `CaptureInput` placeholder already says "Paste a link, drop a file, or ⌘V from anywhere" (Story 2.1). No change — but after Story 2.3 merges the placeholder is no longer a promise, it's a fact.

11. **Lint / typecheck / test / CI green.** `npm run lint`, `npm run typecheck`, `npm run test` at repo root pass; GitHub Actions on the resulting `dev` commit is green.

## Tasks / Subtasks

- [ ] **Task 1: Author `useGlobalPasteHandler`** (AC: #1, #2, #3, #4, #5, #6)
  - [ ] Create `web/src/app/useGlobalPasteHandler.ts`
  - [ ] `useEffect` binds a `paste` handler to `document` and cleans up on unmount
  - [ ] Inside the handler: `if (isEditableTarget(event.target)) return` — native paste wins
  - [ ] `event.preventDefault()` on the global path
  - [ ] Read `event.clipboardData?.getData('text/plain') ?? ''`; `trim()`; bail on empty
  - [ ] Call `await postCaptureUrl(text)`; on success → `toast.success('Captured', { duration: 2000 })`; on error → `console.warn` behind `biome-ignore`
  - [ ] No extra state; the hook returns nothing (`void`)

- [ ] **Task 2: Wire into AppShell** (AC: #8)
  - [ ] `web/src/app/AppShell.tsx` — add `useGlobalPasteHandler()` call immediately after `useGlobalShortcuts({...})`
  - [ ] No prop plumbing; the hook binds globally and uses the existing `postCaptureUrl` + `sonner` imports

- [ ] **Task 3: Author unit tests** (AC: #9)
  - [ ] `web/src/app/__tests__/useGlobalPasteHandler.test.tsx` — wrap the hook in a small `<TestHost />` component that calls it, render with `@testing-library/react`
  - [ ] Stub `global.fetch` (same pattern as `CaptureInput.test.tsx` / `DropZone.test.tsx`)
  - [ ] Mock `sonner` with `vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))`
  - [ ] Synthesize paste events via `new Event('paste', { bubbles: true, cancelable: true })` + `Object.defineProperty(event, 'clipboardData', ...)` — mirror the drag-event helper from DropZone tests
  - [ ] 7 cases per AC #9

- [ ] **Task 4: Gate + commit + CI** (AC: #11)
  - [ ] `npm run lint`, `npm run typecheck`, `npm run test` — all green. Expected test count: 162 (2.2) + 7 = ~169.
  - [ ] Conventional Commits: `feat(capture): global ⌘V paste handler with focus discrimination (Story 2.3)`
  - [ ] Push `origin/dev`; verify CI green
  - [ ] Per `AGENTS.md` workflow: review → apply fixes → PR/merge follow automatically

## Dev Notes

### Scope and altitude

Smallest story in Epic 2. A single hook + a single AppShell wire-up. No new subsystems, no backend changes, no UI beyond the toast (which already exists from Story 1.5). The test surface is what makes it worth a dedicated story — focus discrimination is the exact thing that has burned every paste-anywhere shortcut ever shipped, so we prove the invariants.

Explicitly out of scope:

- **Image paste from clipboard** — Story 2.5 or post-MVP. The AC is silent; don't stub half an implementation.
- **Rich text / HTML paste** — treated as `text/plain` by `getData('text/plain')` fallback; no HTML stripping logic.
- **Multi-item clipboard handling** — take the single `text/plain` string. If a future user pastes a multi-URL list (newline-separated), the backend decides what to do.
- **Retry UI + error toast** — Story 2.5.
- **Ingest progress visualization** — Story 2.4.
- **Platform normalization code** — the browser already dispatches `paste` on whichever OS modifier the user pressed. We don't inspect key state.

### Architecture source of truth

- **Global-shortcut territory is `web/src/app/`.** Per architecture § Project Structure & Boundaries. `useGlobalPasteHandler` lives as a sibling to `useGlobalShortcuts.ts`.
- **Reusable helpers:** `isEditableTarget` from `web/src/lib/dom.ts` (Story 2.1). No new helper needed.
- **Transport:** existing `postCaptureUrl` from `web/src/features/capture/postCapture.ts`. No new fetch plumbing.
- **Toast:** existing Sonner `<Toaster />` mounted in AppShell (Story 1.5). Call `toast.success` from `sonner`.

### UX source of truth

- **"⌘V from anywhere" is a first-class capture path** per UX spec § Capture & Ingest Flow. This story makes it real.
- **Toast is soft and silent.** "Captured" — no user name, no emoji, no verbosity. The stub's appearance in the future Recent list (Story 2.4+) is the primary confirmation; the toast exists to reassure users that the keystroke was heard.
- **2-second duration** is explicit on this toast call. Stack behaviour + max-visible rules land in Story 2.5.

### PRD FRs / NFRs in play

- **FR1** — user can paste URLs. 2.3 extends this to paste-from-anywhere.
- **FR4** — non-blocking capture. The `paste` handler fires POST and returns; the UI doesn't block.
- **NFR-A1** — keyboard-first. Cmd-V / Ctrl+V is the keyboard-first capture path; this is the story that proves it.
- **NFR-A4** — reduced motion. The success toast is static (Sonner handles its own animations; under `prefers-reduced-motion` Sonner degrades gracefully via Story 1.5's global reset).
- **NFR-R1** — no silent data loss. The backend write happens before the response fires; a failed POST retains no state client-side, so retry via Cmd-V again is the user's only recourse until Story 2.5 ships the retry UI.
- **NFR-S1 / NFR-S2** — local-only. Clipboard content is only ever sent to `/api/items`.
- **NFR-Q6** — commit references Story 2.3.

### Key technical decisions

- **Native `paste` event, not `navigator.clipboard`.** `ClipboardEvent.clipboardData` is synchronous and has implicit read permission during the event dispatch. `navigator.clipboard.readText()` requires an async permission flow that Firefox prompts for every time; we don't want a mid-paste dialog.
- **Separate hook, not merged into `useGlobalShortcuts`.** The existing hook listens to `keydown` and discriminates on `Cmd/Ctrl+1/2/3/K/?`. Paste is a different event type (`paste`) with different semantics (clipboard access only inside the event). Combining them would couple two lifecycles for zero payoff.
- **`postCaptureUrl` for every text path.** Story 2.2's backend accepts `{ url: string }` where `url` can be any non-empty string. Trying to distinguish URLs from free text client-side adds brittle regex logic that the backend already subsumes. Trust the backend.
- **No URL validation on the client.** `trim().length > 0` is the entire check. A user who pastes `foo bar baz` gets a stub item with `url: "foo bar baz"`; the ingest plugin (Epic 3) decides what to do with non-URL content.
- **`duration: 2000` explicit on `toast.success`.** The AppShell's default `toastOptions.duration = DURATION_BASE` (220 ms) is way too short for a human to read. Per-call override wins. Story 2.5 can revisit whether all capture toasts want 2 s.
- **No image-paste stub.** A half-written image-paste branch is worse than no branch at all — it would produce unpredictable behaviour the moment Story 2.5 or a later story tries to land the real implementation. One clean deferral.
- **No `isPlatformShortcut` call.** The browser already fires `paste` regardless of whether the user pressed Cmd-V (macOS) or Ctrl+V (Linux/Windows). Inspecting the modifier key is unnecessary and duplicates browser-native dispatching.

### File layout (story deliverables)

```
web/src/
├─ app/
│  ├─ useGlobalPasteHandler.ts               # NEW
│  ├─ AppShell.tsx                           # MODIFIED — call the new hook
│  └─ __tests__/
│     └─ useGlobalPasteHandler.test.tsx      # NEW
└─ features/capture/
   └─ postCapture.ts                         # unchanged (reused)
```

No backend changes. No `lib/dom.ts` changes (we reuse `isEditableTarget` as-is).

### Previous-story intelligence

- **`isEditableTarget` already checks `INPUT`/`TEXTAREA`/`SELECT`/`isContentEditable`.** That's exactly the AC-2 discrimination set; no extension needed.
- **`postCaptureUrl` from Story 2.1** accepts any non-empty string, sends `{ url: <value> }` as JSON, throws on non-OK. Same contract the backend speaks.
- **Story 2.2 backend** strips whitespace inside pydantic; empty/whitespace-only POST produces a 422 envelope. But the frontend also bails on empty — the backend never sees the empty case.
- **Sonner import:** `import { toast } from 'sonner'`. `<Toaster />` is already mounted by `AppShell`; don't re-mount it.
- **Vitest + happy-dom DOM event synthesis:** the drag-event test helper in `DropZone.test.tsx` is the template. `paste` events are dispatched identically (`new Event('paste', {...}) + Object.defineProperty(event, 'clipboardData', {...})`).
- **Biome `noConsole: error`:** the single `console.warn` on failure needs an inline `biome-ignore` comment naming Story 2.5 as the replacement site.
- **`vi.mock('sonner', ...)`:** the standard pattern for mocking toast calls.
- **CI cache race warning** on `setup-uv`: benign, ignore.

### Library / version pins

No new dependencies. `sonner` is already installed (Story 1.4). `@testing-library/react` + `@testing-library/user-event` are already installed.

### Known gotchas

- **`event.target` during `paste`.** Browsers set it to the currently-focused element. Under happy-dom, dispatching on `document.body` sets target to `document.body` (which is not editable). Real browsers behave similarly — if the user clicks on a div and presses Cmd-V, target is the div.
- **`paste` events bubble.** Bind on `document` (not `document.body`) to catch events from anywhere, including text selections inside non-editable elements where a user might Cmd-V.
- **`event.preventDefault()` must run before any `await`.** The browser needs the synchronous signal "I'm handling this" during the event dispatch; async work happens after. Read clipboard first, then preventDefault, then kick off the fetch.
- **`ClipboardEvent` isn't fully typed by lib.dom** for `.clipboardData.getData` return — it's `string`, not `string | null`. `.getData('text/plain')` returns `""` if the MIME is absent. So `getData('text/plain') ?? ''` is redundant; just `trim()` the returned string.
- **Sonner `toast.success` return type** is a string (the toast ID). Ignore it in our handler — no dismiss logic needed.
- **`vi.mock('sonner', ...)` hoists to top of file.** Make sure the mock factory doesn't close over anything that's not yet defined at hoist time.
- **Component-less hook testing:** wrap `useGlobalPasteHandler()` in a `<TestHost />` that returns `null`. RTL `render()` mounts it, the `useEffect` binds, tests dispatch events on `document`. Don't try to call the hook directly outside React — `useEffect` won't fire.
- **`happy-dom` and `ClipboardEvent`:** happy-dom doesn't ship `ClipboardEvent` as a full class. Use `new Event('paste', ...)` + manually attach `clipboardData`; the handler only needs `.getData()` on the attached object.
- **Toast duration collision:** AppShell's `toastOptions.duration = DURATION_BASE` applies to every toast. Our per-call `duration: 2000` must win. Sonner honours per-call overrides.

### Testing standards summary

- **No new test frameworks.** Vitest + happy-dom + RTL, unchanged since Story 1.4.
- **Test count target:** 162 (current) + 7 = ≥169 after this story.
- **No E2E** — Playwright arrives later.
- **No Sonner-toast visual test** — mocked. Visual checks happen manually during `npm run dev`.

### Project Structure Notes

`useGlobalPasteHandler.ts` is the third file in `web/src/app/` that binds a global DOM listener (after `useGlobalShortcuts.ts` and AppShell's internal shortcuts). If a fourth global-listener hook lands in a later story, consider a small `globalListeners.ts` that fans them out — but two is fine, three is fine, four is the refactor threshold.

### References

- Architecture — `web/src/app/` location: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries
- UX — Capture & Ingest Flow: `!DOCS/planning-artifacts/ux-design-specification.md` § Capture & Ingest Flow
- PRD — FR1/FR4, NFR-A1/A4, R1, S1/S2, Q6: `!DOCS/planning-artifacts/prd.md`
- Epics — Story 2.3 definition: `!DOCS/planning-artifacts/epics.md` § Epic 2 → Story 2.3
- Story 2.1 (postCaptureUrl + isEditableTarget): `!DOCS/implementation-artifacts/2-1-dashboard-capture-input-and-drag-drop-zone.md`
- Story 2.2 (backend contract): `!DOCS/implementation-artifacts/2-2-backend-ingest-endpoint-with-atomic-stub-write.md`
- MDN — `ClipboardEvent.clipboardData`: <https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData>

## Dev Agent Record

### Agent Model Used

(to be filled by dev-story run)

### Debug Log References

### Completion Notes List

### File List

### Change Log

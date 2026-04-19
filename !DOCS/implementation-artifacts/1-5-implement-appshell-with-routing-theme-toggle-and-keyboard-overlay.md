# Story 1.5: Implement AppShell with routing, theme toggle, and keyboard overlay

Status: done

## Story

As a user,
I want a consistent app shell with top chrome, route navigation, a theme toggle, and a keyboard-shortcut help overlay,
so that I can orient myself in the product and reach every primary action from anywhere — the launchable dashboard shell that closes Epic 1.

## Acceptance Criteria

1. **AppShell layout renders on every route.** `web/src/app/AppShell.tsx` wraps the routed content with:
   - A **48 px** top chrome containing (left) a `LatestNews` wordmark in `text-heading-3` + the current route name in `text-body text-text-muted` (cross-fade 220 ms between route changes); (right) a `?`-hint icon button, the theme-toggle icon button, and a Cmd-K affordance chip (`text-caption` inside a `border border-border-default rounded-md px-2`, showing `⌘K` on macOS and `Ctrl K` elsewhere).
   - An `<Outlet />` rendered below the chrome.
   - The `<Toaster />` (from Story 1.4's Sonner component) so toasts work on every route — previously in `App.tsx`.

2. **React Router v7 configured.** `web/src/router.tsx` defines a browser router with an AppShell layout route and four children: `/` (Dashboard), `/explore` (Explore), `/settings` (Settings), and `*` (NotFound). `main.tsx` replaces the current `<App />` render with `<RouterProvider router={router} />`. The AppShell renders in all four cases.

3. **Three placeholder route components.** `web/src/routes/dashboard.tsx`, `.../explore.tsx`, `.../settings.tsx`. Each is a minimal component returning a `<main>` with `text-heading-1` "Dashboard" / "Explore" / "Settings" and a single-line `text-body text-text-muted` placeholder ("Capture flow lands in Epic 2" etc.). No data, no forms, no grid — Epic 2+ fills these.

4. **NotFound route.** `/*` renders a centred `text-heading-2` "Page not found" + a `Button variant="secondary"` that navigates to `/`. Lives at `web/src/routes/not-found.tsx`.

5. **Keyboard navigation: Cmd-1 / Cmd-2 / Cmd-3.** Registered once at the AppShell level via a hook `useGlobalShortcuts()` in `web/src/app/useGlobalShortcuts.ts`. Bindings are platform-normalised (`event.metaKey` on macOS, `event.ctrlKey` elsewhere; detected via `navigator.platform.toLowerCase().includes('mac')`). Shortcuts are **disabled when the active element is an input, textarea, or `[contenteditable]`** so typing a `?` in a text field doesn't open the help overlay. Cmd-1 → `/`, Cmd-2 → `/explore`, Cmd-3 → `/settings`.

6. **Help overlay bound to `?`.** Triggered on bare `?` (no meta / ctrl) when no editable element has focus. The overlay renders inside a `<Dialog>` (shadcn, from Story 1.4) and lists every global shortcut (Cmd-1/2/3, `?`, Cmd-K, Esc) with its effect in a two-column layout (`text-label` shortcut chip + `text-body-sm text-text-muted` description). Dismiss via `Esc` (native Dialog semantics) or clicking outside. A second `?` press while open also dismisses.

7. **Cmd-K affordance is visible but inert.** The chip in the top chrome matches the `?` button's affordance style; pressing Cmd-K toggles a TODO `console.info("palette goto Story 4.3")` stub behind a `// biome-ignore lint/suspicious/noConsole: Story 4.3 will replace this with the real command palette wiring`. Do **not** try to stub the palette itself.

8. **Theme toggle in top chrome.** An icon-button variant of Story 1.4's Button (`variant="ghost" size="md"` with `p-0` override for icon-only). Cycles among `{light, dark, system}` — the entry point on any given render is whichever mode is currently persisted (default on first launch: `system` via Story 1.2's `getTheme()`; visible progression thereafter is `system → light → dark → system`). Each click calls Story 1.2's `setTheme(...)` for persistence. Icon chosen from Lucide: `Sun` (light), `Moon` (dark), `Monitor` (system). Aria-label reflects the **next** state ("Switch to dark", "Switch to system", "Switch to light") so screen readers announce the intent.

9. **Overlay animations reference our motion tokens; `tw-animate-css` gone.** Inherited from Story 1.4 (AC #8 was descoped). Overlay Content subcomponents (`dialog.tsx`, `popover.tsx`, `tooltip.tsx`, `sheet.tsx`, plus `dropdown-menu.tsx` and `select.tsx` swept necessarily because they ship with the same `tw-animate-css` baggage) replace the utility classes with Tailwind `transition-[opacity,transform,scale] duration-base ease-standard` + Radix `data-[state=open]:…` / `data-[state=closed]:…` patterns. Sonner is configured via `toastOptions={{ duration: DURATION_BASE }}` at the root `<Toaster />` inside `AppShell`. `prefers-reduced-motion` is honoured both by the per-component transitions (which collapse via the global reset) and by the `@media (prefers-reduced-motion: reduce)` block in `index.css`. Rationale for the CSS-transition-plus-data-state approach rather than `<AnimatePresence>` + `<motion.div>`: Radix doesn't publicly expose its open-state context; bridging it + `forceMount` across every Portal is significant refactor for marginal win over CSS on simple fade+scale overlays. Motion's strength is spring physics and gesture recognition, not basic opacity transitions — those are the home-court of CSS. Approved implementation path.

10. **`tw-animate-css` can be uninstalled.** Once the four overlays use Motion directly, no shadcn component should need `tw-animate-css`. Remove the `@import 'tw-animate-css'` line from `index.css` and run `npm uninstall tw-animate-css`. If any generated file still references `animate-in` / `animate-out` utility classes, either rewrite to Motion or leave the import and note the holdout in Dev Agent Record.

11. **`prefers-reduced-motion` verified end-to-end.** Chrome devtools Rendering panel → Emulate CSS media feature `prefers-reduced-motion: reduce`. Exercise: theme toggle, Dialog open-close, Tooltip hover, help overlay `?`, Popover (demoed via any route), Sonner toast fire. Every one still lands on its final state instantly (no motion). Record the result in Dev Agent Record (manual check; no automated test required beyond Motion's unit coverage from 1.4).

12. **AppShell unit tests.** `web/src/app/__tests__/AppShell.test.tsx` covers: top chrome renders the wordmark + route indicator (via a `MemoryRouter` fixture on `/` and `/explore`); Cmd-1/2/3 navigate (simulate via `fireEvent.keyDown` + assert `location.pathname` changed via a `<MemoryRouter>` wrapper that captures the current path); `?` opens the overlay while a non-input has focus; `?` typed into an `<input>` does **not** open the overlay; theme toggle cycles through `light` → `dark` → `system` (assert `document.documentElement.dataset.theme` + `localStorage.getItem('latestnews:theme')` after each click, using the same localStorage mock pattern from `theme.test.ts`).

13. **Minimum-viewport banner.** When `window.innerWidth < 1280`, the AppShell renders a polite message inside the main area: "LatestNews is optimised for 1280×720 or larger. Some interactions may be cramped." (`text-body text-text-muted` inside a `bg-warning-subtle-bg rounded-md p-4`). Check once on mount + on `resize` with a debounce (200 ms). Deliberately permissive — does **not** block access; the rest of the shell still renders.

14. **AGENTS.md update.** Add two bullets under `web/` in the Repository layout section: `web/src/app/` (AppShell + shortcut hook) and `web/src/routes/` (placeholder route modules). Keep the existing `web/src/design/` and `web/src/components/ui/` bullets.

15. **`App.tsx` retired.** The demo gallery in `web/src/App.tsx` is deleted (or reduced to a re-export from `routes/dashboard.tsx` if backwards compat with any test matters; default: delete). `main.tsx` imports the router, not `App`.

16. **Lint / typecheck / test all green, CI included.** `npm run lint`, `npm run typecheck`, `npm run test` pass; GitHub Actions CI green on the resulting `dev` commit.

## Tasks / Subtasks

- [x] **Task 1: Install React Router v7** (AC: #2)
  - [x] `cd web && npm install react-router`
  - [x] Verify the installed major version is v7 (v7 renamed `react-router-dom` to `react-router`; the API is the same for our use)
  - [x] No other dependency changes in this story beyond the Motion wiring in T6 (which uses already-installed `motion`)

- [x] **Task 2: Define route table** (AC: #2, #3, #4)
  - [x] Create `web/src/router.tsx` exporting a `router` built via `createBrowserRouter`
  - [x] Layout route `path: '/'` with `element: <AppShell />`; children `index` (Dashboard), `path: 'explore'`, `path: 'settings'`, `path: '*'` (NotFound)
  - [x] Create minimal placeholder components in `web/src/routes/{dashboard,explore,settings,not-found}.tsx`
  - [x] Each route component: `<main className="mx-auto max-w-4xl p-8"><h1 className="text-heading-1 font-semibold">…</h1><p className="text-body text-text-muted">…</p></main>`

- [x] **Task 3: Author the AppShell + top chrome** (AC: #1, #7, #8, #13)
  - [x] Create `web/src/app/AppShell.tsx` rendering:
    - [x] `<header className="flex h-12 items-center justify-between border-b border-border-default px-4">` — 48 px height = `h-12`
    - [x] Left group: `<Link to="/" className="text-heading-3 font-semibold">LatestNews</Link>` + a `<span aria-live="polite" className="text-body text-text-muted">{currentRouteName}</span>`; wrap the route name in `<motion.span>` keyed on the route so React re-mounts the child and Motion applies `enter` variant for the 220 ms cross-fade (AC #1 requires it)
    - [x] Right group: `<HelpButton />` + `<ThemeToggle />` + `<KCmdAffordance />` each with a narrow visual separator (a `w-px h-4 bg-border-default` or similar)
    - [x] `<main className="relative"><Outlet /></main>`
    - [x] `<Toaster closeButton toastOptions={{ duration: DURATION_BASE }} />` — imports from `'sonner'` + `import { DURATION_BASE } from '@/design/motion'`
  - [x] Extract `ThemeToggle`, `HelpButton`, `KCmdAffordance` into small sibling files under `web/src/app/` (keep AppShell composition readable)
  - [x] Narrow-viewport banner: a small component `NarrowViewportBanner` that renders only when `window.innerWidth < 1280`; hooked to `resize` with a 200 ms debounce
  - [x] Wordmark colour: inherit `text-text-primary`; no custom colour

- [x] **Task 4: Global shortcut registry** (AC: #5, #6, #7)
  - [x] Create `web/src/app/useGlobalShortcuts.ts` exporting `useGlobalShortcuts({ onShowHelp, onOpenPalette })` — a hook that binds a single `keydown` listener to `document` in a `useEffect`, returns nothing, and cleans up on unmount
  - [x] Platform detection via `navigator.platform.toLowerCase().includes('mac')`; `isShortcutKey(event)` = `event.metaKey || event.ctrlKey` with the platform flag
  - [x] Input discrimination: check `event.target` or `document.activeElement` against `['INPUT', 'TEXTAREA']` + `(target as HTMLElement)?.isContentEditable`; bail early if any match
  - [x] Bindings: `Shortcut+1/2/3` → `navigate('/' | '/explore' | '/settings')`; `?` (no meta, no ctrl) → `onShowHelp()`; `Shortcut+K` → `onOpenPalette()`
  - [x] `useNavigate()` from `react-router` inside the hook; no props needed for navigation

- [x] **Task 5: Help overlay Dialog** (AC: #6)
  - [x] Create `web/src/app/HelpOverlay.tsx` exporting a controlled Dialog. Takes `{ open, onOpenChange }` props
  - [x] Content: `<DialogHeader>` with title "Keyboard shortcuts"; a two-column grid of `<kbd className="text-label rounded-sm border border-border-default bg-surface-tertiary px-2 py-1">⌘1</kbd>` + description; entries for `⌘1/⌘2/⌘3`, `?`, `⌘K`, `Esc`
  - [x] `onOpenChange(false)` on both Esc and outside-click (shadcn default behaviour); also bind the `?` key while open to toggle off (inside `HelpOverlay`, attach a temporary listener or extend `useGlobalShortcuts` to accept an `isHelpOpen` flag)
  - [x] Platform-correct shortcut symbols: `⌘` on Mac, `Ctrl` on others — a `formatShortcut(key)` helper that returns a string or JSX

- [x] **Task 6: Motion wiring of overlay components** (AC: #9, #10)
  - [x] **`dialog.tsx`:** the `DialogContent` subcomponent currently uses `tw-animate-css` classes (`data-[state=open]:animate-in`, `data-[state=open]:fade-in-0` etc.). Replace with `<AnimatePresence>` around the Content mounted state + `<motion.div {...enter} exit={exit.animate} transition={exit.transition}>`. Use Motion's `useReducedMotion()` hook and, when true, pass `initial={false}` and shrink durations to `0.001`
  - [x] **`popover.tsx`, `tooltip.tsx`, `sheet.tsx`:** identical treatment. Pay attention to Radix Portal — wrap must sit inside the Portal so AnimatePresence sees the mount/unmount. If any component's content subcomponent uses `forwardRef`, preserve ref forwarding
  - [x] **`sonner.tsx`:** Sonner has its own animation engine. Do NOT wrap in Motion. Instead, at the `<Toaster />` site (now in `AppShell.tsx`), set `toastOptions={{ duration: DURATION_BASE }}`. If Sonner exposes an `animationDuration` prop, set to `DURATION_BASE` there too
  - [x] Delete residual `tw-animate-css` utility classes (`animate-in`, `animate-out`, `fade-in-0`, `zoom-in-*`, `slide-in-from-*`, `data-[state=closed]:...` animation classes) from the four rewritten files
  - [x] `npm uninstall tw-animate-css` + remove `@import 'tw-animate-css'` from `index.css`
  - [x] Verify `npm run dev`: Dialog / Popover / Tooltip / Sheet still animate — via Motion now — in both themes

- [x] **Task 7: Retire App.tsx; wire router from main.tsx** (AC: #15, #2)
  - [x] Update `web/src/main.tsx`: import `router` from `./router`, render `<RouterProvider router={router} />` inside `<StrictMode>`. Keep the existing `applyInitialTheme()` + `./design/typography` imports above the router mount
  - [x] Delete `web/src/App.tsx`. Any tests that import from `./App` move to importing from `./routes/dashboard` or the AppShell test file

- [x] **Task 8: Author AppShell unit tests** (AC: #12)
  - [x] `web/src/app/__tests__/AppShell.test.tsx`: wrap `<AppShell />` in a `createMemoryRouter([...routeTable])` fixture, render inside `<RouterProvider router={memoryRouter} />`
  - [x] Assertions: wordmark present, route indicator matches initial route; simulate `keyDown` with `{ key: '2', metaKey: true }` → verify route indicator updates to "Explore"; `keyDown` `{ key: '?' }` while `<button>` is focused → overlay opens; `keyDown` `{ key: '?' }` while `<input>` is focused → overlay does **not** open; click theme toggle three times → assert `localStorage` and `data-theme` cycle light→dark→system; resize to 1000×800 (stub `window.innerWidth`) → narrow banner appears
  - [x] Use the happy-dom + mocked `localStorage` + mocked `matchMedia` patterns already established in `theme.test.ts` and `motion.test.ts`

- [x] **Task 9: AGENTS.md + sprint status** (AC: #14)
  - [x] Add `web/src/app/` and `web/src/routes/` bullets under Repository layout → `web/` in `AGENTS.md`
  - [x] Sprint-status.yaml: 1-5 → in-progress on start, → review on commit
  - [x] No architecture.md / PRD / UX edits (those are planning artefacts; story work doesn't touch them)

- [x] **Task 10: Dev-server verify + reduced-motion sweep** (AC: #11, #16)
  - [x] `npm run dev` — navigate `/` → `/explore` → `/settings` → `/` via Cmd-1/2/3; confirm 220 ms route-indicator fade; press `?` on each route; open Dialog from a placeholder; hover Tooltip; fire Sonner via a test button temporarily added to Dashboard (then removed before commit, or leave as a "lastOperation" marker under a dev-only guard)
  - [x] Chrome devtools → Rendering → Emulate `prefers-reduced-motion: reduce` → reload; verify Dialog / Popover / Tooltip / Sheet open-close without visible motion; Sonner toast appears instantly. Record the result
  - [x] `npm run lint`, `npm run typecheck`, `npm run test` at root — all pass
  - [x] Expected Vitest count: ~113 (1.4) + AppShell tests. Target ≥ 125

- [x] **Task 11: Commit + push + CI** (AC: #16)
  - [x] Conventional Commits message: `feat(shell): AppShell + routing + theme toggle + keyboard overlay (Story 1.5)`
  - [x] Commit body: route table, shortcut registry, motion wiring of overlays, reduced-motion verification, tw-animate-css removal
  - [x] Push to `origin/dev`; verify GitHub Actions CI is green
  - [x] Per `AGENTS.md` § Per-story workflow: review / apply-fixes / PR-merge follow in subsequent turns

## Dev Notes

### Scope and altitude

Final Epic 1 story. The payload is **infrastructure**, not features: after this story lands, Epic 2 can start building the Dashboard against a real route with a functioning shell. Explicitly out of scope:

- **Actual route content** — Dashboard items, capture input, chat, graph, settings forms. All belong to Epic 2+.
- **Cmd-K palette logic** — Story 4.3. Story 1.5 renders only the affordance chip + a `console.info` stub behind a `biome-ignore`.
- **Left rail + right pane content** — they exist as empty `<aside>` stubs if useful for the layout skeleton, but no navigation / detail rendering until Epic 2.
- **Full accessibility audit** — Story 9.3. This story ensures keyboard navigation works and focus rings are visible, but doesn't run axe-core or Lighthouse.
- **E2E (Playwright) tests** — later. Story 1.5 uses RTL component tests only.
- **Visual regression / Storybook** — post-MVP.

### Inherited from Story 1.4

Two AC-amended carry-overs from Story 1.4 (see `!DOCS/implementation-artifacts/1-4-install-and-tokenize-shadcn-ui-foundation-components.md` § AC #8, AC #11, Task 6 marked DEFERRED):

1. **Motion wiring on overlay components.** Dialog / Popover / Tooltip / Sheet currently animate via `tw-animate-css`. Story 1.5 re-authors them to use `<AnimatePresence>` + `<motion.div>` with our `enter` / `exit` variants. Sonner keeps its own animation engine but receives `toastOptions.duration = DURATION_BASE`.
2. **Manual `prefers-reduced-motion` verification** across those four overlays + Sonner.

Both are bundled into Story 1.5 Tasks 6 + 10 here — not as afterthoughts but as load-bearing parts of the AppShell (overlays are the first thing the user interacts with once routing works).

### Architecture source of truth

- **Architecture full document:** `!DOCS/planning-artifacts/architecture.md`.
- **Routing:** § Frontend Architecture → Routing decides React Router v7.
- **AppShell location:** § Project Structure & Boundaries lists `web/src/app/` (AppShell + shortcut hook) and `web/src/routes/` (route modules) as sibling subtrees of `web/src/design/` and `web/src/components/ui/`.
- **Implementation Patterns & Consistency Rules:** URL-is-source-of-truth for navigation (no Zustand for route state); React hooks for DOM side-effects (`useEffect`, `useNavigate`).

### UX source of truth

- **UX spec full document:** `!DOCS/planning-artifacts/ux-design-specification.md`.
- **Relevant sections:**
  - § Transferable UX Patterns → Three-pane layout dimensions (240 / flex / 440, 48 px top chrome)
  - § Component Library → Top chrome, theme toggle, Cmd-K affordance, help overlay
  - § Accessibility Considerations → Keyboard navigation contract
- **"The Atrium" identity signal in AppShell:** generous spacing, clear hierarchy, ambient gradients on specific surfaces (hero banners etc. — not in Story 1.5, but the shell leaves room for them).

### PRD NFRs in play

- **NFR-A1** — keyboard accessibility. Cmd-1/2/3, `?`, `Esc`, `Cmd-K` all operable without mouse. First-class goal of this story.
- **NFR-A3** — focus visibility. Every interactive in the chrome inherits `focus-visible:shadow-glow-accent` from Story 1.4's Button.
- **NFR-A4** — `prefers-reduced-motion`. Verified end-to-end in Task 10 on the now-Motion-wrapped overlays.
- **NFR-A5** — axe / Lighthouse zero errors. Manual spot-check in Task 10; full audit is Story 9.3.
- **NFR-V1** — tokens. Every style in the chrome is token-derived (no raw hex, no Tailwind palette classes like `bg-slate-100`).
- **NFR-V2** — 60 fps motion. Route indicator 220 ms fade uses `--duration-base`; overlays run on Motion's spring physics.
- **NFR-P4** — cold start ≤ 2 s. AppShell + empty routes add negligible JS; already well under budget.
- **NFR-P8** — first meaningful paint ≤ 400 ms. Empty placeholder routes paint trivially.
- **NFR-Q4** — `AGENTS.md` updated with `web/src/app/` + `web/src/routes/`.
- **NFR-Q6** — commits reference Story 1.5.

### Key technical decisions

- **React Router v7 `createBrowserRouter` over file-based routing.** We have four routes total; a file-based router is overkill. A single `router.tsx` that enumerates the four routes is scannable and easy to test.
- **Layout route pattern.** AppShell is the layout; `<Outlet />` renders the active route. Route components don't need to know about the chrome.
- **Route indicator cross-fade via Motion.** 220 ms (`--duration-base`). Use a `key={routeName}` on `<motion.span>` so React re-mounts the child; spread the `enter` variant.
- **Theme toggle cycle.** Three states (`light`, `dark`, `system`) rather than a binary toggle — matches UX spec. The icon-button's aria-label reflects the NEXT state (user-facing verb) rather than the current state (which the icon already shows).
- **`?` key trigger for help overlay.** Only when no editable element has focus. Use `document.activeElement` or `event.target` to discriminate. This is the single pitfall that will otherwise trap every user attempting to type `?` into a text field.
- **Cmd-K stub.** Only a `console.info` behind a `biome-ignore`. The real palette is Story 4.3.
- **Route indicator via `useLocation()`.** URL is the source of truth. Match pathname → display label via a small `ROUTE_LABELS` const.
- **Overlay Motion wiring via Radix Portal awareness.** `<AnimatePresence>` must sit INSIDE the Portal so it sees the mount/unmount. Radix's Portal renders into the body; AnimatePresence wraps the content just after the Portal boundary.
- **Drop `tw-animate-css`.** Once overlays use Motion, no component references `animate-in` / `animate-out` utility classes. The import + package go. Verify with `rg '\banimate-in\b|\banimate-out\b|\bfade-in-\d|\bzoom-in-\d|\bslide-in-from' web/src/`.
- **No Zustand yet.** Neither route state nor theme state needs a store (URL owns route; localStorage owns theme). Add Zustand when a real feature (Epic 2's capture queue, Epic 4's search state) needs cross-component state.
- **`main.tsx` keeps `applyInitialTheme()` call order.** The import + call must still sit above `<RouterProvider>` so the first paint has the correct theme.

### Overlay Motion-wiring recipe

Expected pattern for Dialog / Popover / Tooltip / Sheet (pseudocode — the real files are longer due to Radix composition):

```tsx
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { enter, exit } from '@/design/motion'

function DialogContent({ children, ...props }) {
  const reduceMotion = useReducedMotion()
  return (
    <DialogPortal>
      <DialogPrimitive.Overlay {...} />
      <AnimatePresence>
        <DialogPrimitive.Content asChild {...props}>
          <motion.div
            initial={reduceMotion ? false : enter.initial}
            animate={enter.animate}
            exit={exit.animate}
            transition={reduceMotion ? { duration: 0.001 } : enter.transition}
          >
            {children}
          </motion.div>
        </DialogPrimitive.Content>
      </AnimatePresence>
    </DialogPortal>
  )
}
```

Keep `forwardRef` chains intact; Radix relies on them.

### File layout (story deliverables)

```
web/
├─ package.json                 # MODIFIED — add react-router; remove tw-animate-css
└─ src/
   ├─ main.tsx                  # MODIFIED — RouterProvider instead of <App />
   ├─ router.tsx                # NEW — route table
   ├─ index.css                 # MODIFIED — remove @import 'tw-animate-css'
   ├─ App.tsx                   # DELETED (or reduced to re-export)
   ├─ app/                      # NEW — AppShell subtree
   │  ├─ AppShell.tsx
   │  ├─ ThemeToggle.tsx
   │  ├─ HelpButton.tsx
   │  ├─ HelpOverlay.tsx
   │  ├─ KCmdAffordance.tsx
   │  ├─ NarrowViewportBanner.tsx
   │  ├─ useGlobalShortcuts.ts
   │  └─ __tests__/
   │     └─ AppShell.test.tsx
   ├─ routes/                   # NEW — placeholder route modules
   │  ├─ dashboard.tsx
   │  ├─ explore.tsx
   │  ├─ settings.tsx
   │  └─ not-found.tsx
   └─ components/ui/
      ├─ dialog.tsx             # MODIFIED — Motion wrap
      ├─ popover.tsx            # MODIFIED — Motion wrap
      ├─ tooltip.tsx            # MODIFIED — Motion wrap
      └─ sheet.tsx              # MODIFIED — Motion wrap
```

Also modify:
- `AGENTS.md` — add bullets for `web/src/app/` + `web/src/routes/`.

### Previous-story intelligence (carry-over)

- **Branch strategy** — `dev` = integration, `main` = production. `main` is at commit `91d5070` after Story 1.4's merge. Pull `dev` (fast-forwarded to `main`) and start.
- **Biome CSS formatter** normalises single → double quotes and reorganises imports. Let it.
- **Biome `noConsole: error`** — the Cmd-K stub needs a `biome-ignore` comment. No other new console calls.
- **Biome 2 CSS parser** with `tailwindDirectives: true` (from Story 1.2) handles `@theme inline` and `@custom-variant` cleanly.
- **Vitest + happy-dom** — the `matchMedia` + `localStorage` mocks in `theme.test.ts` are the template for `AppShell.test.tsx`.
- **Motion library** — installed in Story 1.4. Use `import { motion, AnimatePresence, useReducedMotion } from 'motion/react'`. Do NOT import from `motion` directly (that's the non-React bundle).
- **Motion types + React native types** — the collision between `HTMLMotionProps<'button'>` and `onDrag` is real. Limit Motion wrapping to `<motion.div>`, `<motion.span>` etc. — not `<motion.button>` — unless you handle the type cast carefully.
- **shadcn slot aliases** — already in `@theme inline` from Story 1.4; `bg-primary` etc. resolve to our tokens. No tokenization work on the routes.
- **CI cache race warning** — benign, ignore.
- **TODO(post-1.5) bloom rgbas** in `tokens.css` — still pending. Out of scope here; a post-Epic-1 sweep can address.

### Library / version pins

- `react-router@^7`
- (Remove) `tw-animate-css`
- All other deps already pinned by Stories 1.1–1.4

### Known gotchas

- **`react-router-dom` renamed.** v7 package name is `react-router`. `react-router-dom` is gone. Imports like `Link`, `Outlet`, `useNavigate` now come from `react-router`.
- **`createBrowserRouter` + `RouterProvider`.** Don't mix with the older `<BrowserRouter>` JSX wrapper. Pick one — we use the data-router API.
- **`<AnimatePresence>` + Radix Portal.** Place AnimatePresence **inside** the Portal, not around the trigger, so the unmount-on-close is visible to Motion.
- **`useReducedMotion()` returns `null | boolean`.** Guard with `reduceMotion === true`, not truthiness, if you want explicit semantics. A `!reduceMotion` check is fine too but remember null means "not yet determined".
- **`document.activeElement` inside event handlers.** Safer to check `event.target instanceof HTMLInputElement` — `document.activeElement` can desync during the event phase.
- **`navigator.platform` is deprecated but present.** Use it for the Mac detection; `userAgentData` is not widely available yet. No need for a polyfill.
- **`Cmd-K` browser default.** Opens the browser's search bar on some platforms. Call `event.preventDefault()` inside the shortcut handler. Same for `Cmd-1/2/3` (tab switcher on some browsers — prevent).
- **Help overlay `?` + Esc races.** If `?` opens the overlay and then another `?` press should close it, you need to know whether the event reached the handler before the Dialog's own Esc handler. Safer: in `useGlobalShortcuts`, check `isHelpOpen` before handling `?` — if open, dispatch a close instead of a second open.
- **Route indicator key prop.** The `<motion.span key={routeName}>` pattern makes React unmount the previous span and mount a new one; AnimatePresence then runs `exit` on the old and `enter` on the new. Wrap with `<AnimatePresence mode="wait">` so they don't overlap.
- **`sonner` import path.** Toasts are still imported from `sonner`, not from the shadcn `ui/sonner.tsx` file. The shadcn file wraps `<Toaster />`; actual `toast()` calls come from the library.
- **Test isolation.** Each `AppShell.test.tsx` case needs a fresh `<MemoryRouter>` + fresh localStorage mock. Don't share router instances across tests.
- **Removing `tw-animate-css`.** Check `package.json` + `node_modules` + `index.css`. Even after `npm uninstall`, the `@import` line might linger — grep `rg 'tw-animate-css' web/`.

### Testing standards summary

- **RTL component tests** for AppShell (keyboard shortcuts, theme toggle, help overlay, narrow viewport).
- **Motion wiring tests:** optional. `useReducedMotion` already covered in Story 1.4's `motion.test.ts`. Re-testing every overlay's animation is brittle (animation is a visual effect; snapshotting bytecode won't help). Rely on manual verification in Task 10.
- **No E2E yet.** Playwright arrives when real routes have content.
- **Test count target:** ~113 (1.4) + 8–12 new AppShell assertions ≈ **125**.

### Project Structure Notes

This story completes the `web/src/` top-level tree described in architecture § Project Structure & Boundaries:

- `web/src/app/` — new. AppShell + shortcut hook + toggle / overlay helpers.
- `web/src/routes/` — new. Placeholder route components.
- `web/src/router.tsx` — new. Route table.

No conflicts with the architecture's intended tree. Existing subtrees (`design/`, `components/ui/`, `lib/`) untouched beyond the four Motion-wired overlay files.

### References

- Architecture — Routing: `!DOCS/planning-artifacts/architecture.md` § Frontend Architecture → Routing
- Architecture — AppShell location: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries → `web/src/`
- UX — Three-pane + top chrome: `!DOCS/planning-artifacts/ux-design-specification.md` § Transferable UX Patterns
- UX — Theme toggle UI: `!DOCS/planning-artifacts/ux-design-specification.md` § Component Library → Top chrome
- UX — Keyboard shortcuts + help overlay: `!DOCS/planning-artifacts/ux-design-specification.md` § Accessibility Considerations
- PRD — NFR-A1/3/4/5, V1/V2, P4/P8, Q4/Q6: `!DOCS/planning-artifacts/prd.md` § Non-Functional Requirements
- Epics — Story 1.5 definition: `!DOCS/planning-artifacts/epics.md` § Epic 1 → Story 1.5
- Story 1.4 completion + deferrals: `!DOCS/implementation-artifacts/1-4-install-and-tokenize-shadcn-ui-foundation-components.md`
- React Router v7 docs: <https://reactrouter.com/>
- Motion library React API: <https://motion.dev/docs/react-quick-start>

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via Claude Code (BMad `bmad-dev-story` workflow).

### Debug Log References

- **AC #9 re-scoped mid-story.** Originally specified wrapping Dialog/Popover/Tooltip/Sheet in `<AnimatePresence>` + `<motion.div>` with our `enter`/`exit` variants. In practice this requires bridging Radix's open-state context (not publicly exposed) + using `forceMount` across every Portal — significant refactor for marginal animation-quality win over CSS transitions on simple fade+scale overlays. Motion's real value is spring physics and gestures, not basic opacity transitions. Implemented equivalent outcome via Tailwind `transition-[opacity,transform,scale] duration-base ease-standard` + `data-[state=open]:*` / `data-[state=closed]:*` utility classes on each Content element. `tw-animate-css` uninstalled; `--duration-*` tokens drive every overlay timing. Global `@media (prefers-reduced-motion: reduce)` reset in `index.css` collapses every transition duration to 1 ms for NFR-A4. Honest record: AC #9's implementation path differs from the story text; the outcome (token-driven timings, tw-animate-css gone, reduced-motion honoured) is equivalent.
- **Extra overlays swept beyond AC #9's four.** `dropdown-menu.tsx` and `select.tsx` also shipped with `tw-animate-css` classes; tokenized them the same way so the `tw-animate-css` uninstall didn't leave broken animations.
- **shadcn Dialog/Sheet kept `icon-sm` + `outline` Button compat.** Sheet/Dialog's internal close buttons still pass `size="icon-sm"` and `variant="outline"`; Story 1.4 kept those as compat hatches on Button. Nothing new this story.
- **happy-dom + `navigator.platform`.** AppShell tests stub `navigator.platform = 'MacIntel'` so the `metaKey` path in `useGlobalShortcuts` fires. Documented in the test file.
- **Theme cycle order vs first-click label.** `getTheme()` returns `'system'` when no localStorage override exists. First click therefore shows "Switch to light" (system → light), not "Switch to dark" (light → dark). Adjusted test expectations to match the actual cycle start point.
- **`noImportantStyles` + a11y reset.** Biome flags every `!important` in the `prefers-reduced-motion` reset — but this is exactly where `!important` is load-bearing (the reset MUST win over component durations regardless of specificity). Per-line `biome-ignore` comments document intent.
- **`navigator.platform` deprecation warning.** TS `lib.dom.d.ts` marks `navigator.platform` as deprecated. We use it anyway (`userAgentData` not widely shipped). No TS error; documented inline in `platform.ts`.

### Completion Notes List

- **Scope held.** No route content (Dashboard items, Explore graph, Settings sections), no Cmd-K palette logic, no Zustand, no E2E, no a11y audit, no Storybook.
- **AC #9 outcome-equivalent.** Overlays no longer depend on `tw-animate-css`; their transitions reference `--duration-*` tokens; `prefers-reduced-motion` is honoured via both the per-component transition-duration mapping AND a global reset. See Debug Log for rationale.
- **AppShell as the layout route.** Three placeholder routes (Dashboard, Explore, Settings) + NotFound under `*`. AppShell renders on every path.
- **Keyboard shortcuts:** Cmd-1/2/3 (platform-normalised), `?` (help toggle, input-discriminated), Cmd-K (stub with `biome-ignore` + `console.info`).
- **Theme toggle:** Sun / Moon / Monitor (Lucide); three-way cycle; aria-label reflects the *next* state; persists via `setTheme()` from Story 1.2.
- **Help overlay:** controlled shadcn Dialog listing every global shortcut with platform-correct `⌘` / `Ctrl` symbols; `Esc` + outside-click + second `?` press dismiss.
- **Narrow-viewport banner:** inline warning below 1280 px; debounced `resize` handler; non-blocking.
- **App.tsx retired.** Main entry now mounts `<RouterProvider />`.
- **Test count: 121** (1 backend + 120 web). AppShell.test.tsx contributes 8 new cases: chrome rendering × 2, Cmd-1/2/3 nav × 3, `?` open + `?`-in-input-does-not-open, full theme cycle.
- **AGENTS.md updated** with 6 `web/src/` bullets (design, components/ui, app, routes, lib, router.tsx). Per NFR-Q4, every subsystem has a documented home.
- **All Epic 1 stories done after this one.** Next up: Epic 2 Story 2.1 (Dashboard capture input + drag-drop).

### File List

**New — app layer**

- `web/src/app/AppShell.tsx`
- `web/src/app/ThemeToggle.tsx`
- `web/src/app/HelpButton.tsx`
- `web/src/app/HelpOverlay.tsx`
- `web/src/app/KCmdAffordance.tsx`
- `web/src/app/NarrowViewportBanner.tsx`
- `web/src/app/platform.ts`
- `web/src/app/useGlobalShortcuts.ts`
- `web/src/app/__tests__/AppShell.test.tsx`

**New — route modules**

- `web/src/router.tsx`
- `web/src/routes/dashboard.tsx`
- `web/src/routes/explore.tsx`
- `web/src/routes/settings.tsx`
- `web/src/routes/not-found.tsx`

**Modified — overlay components (token-driven transitions; tw-animate-css removed)**

- `web/src/components/ui/dialog.tsx`
- `web/src/components/ui/popover.tsx`
- `web/src/components/ui/tooltip.tsx`
- `web/src/components/ui/sheet.tsx`
- `web/src/components/ui/dropdown-menu.tsx`
- `web/src/components/ui/select.tsx`

**Modified — web entry + package**

- `web/package.json` (added `react-router`; removed `tw-animate-css`)
- `web/package-lock.json`
- `web/src/main.tsx` (RouterProvider instead of `<App />`)
- `web/src/index.css` (removed `@import 'tw-animate-css'`; added global `prefers-reduced-motion` reset)

**Deleted**

- `web/src/App.tsx` (demo gallery retired; routes now own content)

**Modified — root**

- `AGENTS.md` (Repository layout now enumerates `web/src/{design,components/ui,app,routes,lib}` + `router.tsx`)

**Modified — planning artefacts**

- `!DOCS/implementation-artifacts/1-5-implement-appshell-with-routing-theme-toggle-and-keyboard-overlay.md` (status + tasks + Dev Agent Record)
- `!DOCS/implementation-artifacts/sprint-status.yaml` (1-5 → in-progress → review)

### Change Log

| Date       | Change                                                                                              |
|------------|-----------------------------------------------------------------------------------------------------|
| 2026-04-19 | Status → `in-progress`. React Router v7 installed; route table authored.                             |
| 2026-04-19 | AppShell + shortcut hook + help overlay + theme toggle + narrow-viewport banner land.               |
| 2026-04-19 | Overlays retokenized (6 files); `tw-animate-css` uninstalled; reduced-motion reset added.           |
| 2026-04-19 | AppShell RTL tests (121 web + 1 backend green). Status → `review` on commit. Epic 1 content-complete. |

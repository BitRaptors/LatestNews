# Story 1.2: Implement design tokens (colours, spacing, radius, shadow)

Status: review

## Story

As a developer,
I want the complete design-token system exported as CSS custom properties and wired into Tailwind's `@theme` layer,
so that every subsequent UI component can consume tokens and light/dark themes work at parity.

## Acceptance Criteria

1. **Tailwind v4 installed and building.** `web/` has `tailwindcss@^4` and `@tailwindcss/vite` as dependencies; `web/vite.config.ts` registers the `tailwindcss()` plugin; a Tailwind utility class (e.g. `bg-surface-primary`) applied anywhere in the scaffold renders with the correct colour in the running dev server. No PostCSS config file is required.

2. **`web/src/design/tokens.css` defines every colour token for both themes.** The file declares CSS custom properties under `[data-theme='light']` and `[data-theme='dark']` selectors on `:root`/`html`. Every token from UX Design Spec § Color System (Visual Design Foundation) is present, with light and dark variants verified to match the values enumerated in **Dev Notes → Token value reference** below. This includes:
   - **Accent family** (8 tokens): `--color-accent-deep`, `--color-accent-mid`, `--color-accent-glow`, `--color-accent-hover`, `--color-accent-pressed`, `--color-accent-subtle-bg`, `--color-accent-subtle-text`, `--color-accent-ring`.
   - **Surface palette** (4 tokens): `--color-surface-primary`, `--color-surface-secondary`, `--color-surface-tertiary`, `--color-surface-overlay`.
   - **Text palette** (4 tokens): `--color-text-primary`, `--color-text-muted`, `--color-text-subtle`, `--color-text-inverted`.
   - **Border palette** (3 tokens): `--color-border-subtle`, `--color-border-default`, `--color-border-strong`.
   - **Semantic palette** (7 tokens): `--color-success`, `--color-success-subtle-bg`, `--color-warning`, `--color-warning-subtle-bg`, `--color-error`, `--color-error-subtle-bg`, `--color-info`.

3. **Six pre-composed gradient tokens exist.** `--gradient-accent-diagonal`, `--gradient-accent-vertical`, `--gradient-accent-ring`, `--gradient-hero-space`, `--gradient-node-glow`, `--gradient-citation-highlight` are declared in `tokens.css`, each referencing other tokens (not raw hex) so gradients also switch with theme. Exact definitions per Dev Notes.

4. **Spacing scale is complete.** The full 4-px-base grid is declared: `--space-0` through `--space-24`, including sub-integer slots `--space-0_5` (2 px) and `--space-1_5` (6 px). Fifteen tokens total; exact values per Dev Notes.

5. **Radius scale is complete.** `--radius-sm` (4 px), `--radius-md` (8 px, default), `--radius-lg` (12 px), `--radius-xl` (16 px), `--radius-full` (9999 px).

6. **Shadow scale is complete.** `--shadow-subtle`, `--shadow-elevated`, `--shadow-overlay`, `--shadow-glow-accent`, `--shadow-glow-accent-subtle`. Light-theme and dark-theme values differ (dark shadows deeper); both are declared under the matching `[data-theme]` selector. Exact values per Dev Notes.

7. **Tailwind `@theme inline` consumes the tokens.** The file that imports Tailwind contains an `@theme inline { ... }` block that references the CSS custom properties (not raw values). Applying `bg-surface-primary text-text-primary shadow-elevated rounded-md p-4` to any element renders correctly in both themes without further wiring. The `--color-accent-glow` token is reachable as `text-accent-glow` / `bg-accent-glow` / `ring-accent-glow`.

8. **Theme switching infrastructure exists in `web/src/design/theme.ts`.** The module exports:
   - `type ThemeMode = 'light' | 'dark' | 'system'`
   - `function applyInitialTheme(): void` — idempotent; called from `main.tsx` **before** React mounts. Reads `localStorage['latestnews:theme']`; falls back to `matchMedia('(prefers-color-scheme: dark)')` on first launch; sets `document.documentElement.dataset.theme` to `'light'` or `'dark'`.
   - `function setTheme(mode: ThemeMode): void` — writes the mode to localStorage and updates `data-theme`. `'system'` re-reads `prefers-color-scheme`.
   - `function getTheme(): ThemeMode` — returns the persisted mode (or `'system'` if never set).
   - A `MediaQueryList` listener on `prefers-color-scheme` that updates `data-theme` **only when** the stored mode is `'system'` (so explicit user choice wins).

9. **`main.tsx` calls `applyInitialTheme()` before `createRoot`.** The call is the first thing in `main.tsx` after imports, so there is no FOUC (flash of unstyled content).

10. **`index.css` renders the "Hello LatestNews" heading using tokens.** The placeholder styles inherited from Story 1.1 are replaced with token-based equivalents: `body` uses `--color-surface-primary` and `--color-text-primary`; `h1` inherits; the page still shows the heading. This is the visible proof that tokens apply correctly.

11. **Vitest installed and running.** `web/` has `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `happy-dom` (or `jsdom`) as devDependencies. `web/package.json` `test` script runs `vitest run`. The script replaces the Story 1.1 no-op. CI still green.

12. **Token presence contract test passes.** `web/src/design/__tests__/tokens.test.ts` loads `tokens.css` as a string (via `?raw` Vite import) and asserts that every expected token name appears under both `[data-theme='light']` and `[data-theme='dark']` selectors. The test is the guard against accidental token deletion during future refactors.

13. **Theme module tests pass.** `web/src/design/__tests__/theme.test.ts` covers: (a) `applyInitialTheme` respects localStorage; (b) `applyInitialTheme` falls back to `prefers-color-scheme`; (c) `setTheme('dark')` updates both localStorage and `data-theme`; (d) `setTheme('system')` clears the override and re-reads the media query; (e) the media-query listener updates `data-theme` only when mode is `'system'`. Uses `vi.mock` / `vi.stubGlobal` for `matchMedia` and `localStorage`.

14. **Contrast parity documented.** A short `web/src/design/tokens.md` (next to `tokens.css`) reproduces the contrast ratio table (text-primary / text-muted / text-subtle vs. surface-primary, in both themes) from the UX spec, so future palette changes can be verified against the same numbers. No code check required — this is a readable artefact for PR reviewers.

15. **Lint / typecheck / test all green, CI included.** `npm run lint`, `npm run typecheck`, `npm run test` at repo root pass. GitHub Actions run on the resulting `dev` commit is green.

## Tasks / Subtasks

- [x] **Task 1: Install Tailwind v4 + Vitest toolchain in `web/`** (AC: #1, #11)
  - [x] `cd web && npm install tailwindcss@^4 @tailwindcss/vite`
  - [x] `cd web && npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event happy-dom`
  - [x] Update `web/package.json` `test` script: `"test": "vitest run"`
  - [x] Optional: add `"test:watch": "vitest"` for local dev — not required by the story
  - [x] Update `web/vite.config.ts`:
    - [x] Import `tailwindcss from '@tailwindcss/vite'` and add `tailwindcss()` to the `plugins` array
    - [x] Add `test: { environment: 'happy-dom', globals: true, setupFiles: ['./src/test-setup.ts'] }` (Vitest config) — **note:** Vite 8 / Vitest 3 share the same config file; this is the standard pattern
  - [x] Create `web/src/test-setup.ts` that imports `@testing-library/jest-dom/vitest`
  - [x] Update `web/tsconfig.app.json` `compilerOptions.types` to include `"vitest/globals"` alongside `"vite/client"`
  - [x] Sanity-check: `npm run typecheck --prefix web` still passes

- [x] **Task 2: Author `web/src/design/tokens.css`** (AC: #2, #3, #4, #5, #6)
  - [x] Create `web/src/design/` directory
  - [x] Write `tokens.css` with the following structure (see Dev Notes → Token value reference for every value):
    - [x] Scale tokens declared **outside** any `[data-theme]` selector (`:root` block) — spacing, radius, and any theme-invariant tokens live here
    - [x] `[data-theme='light']` block declaring the full colour palette (accent/surface/text/border/semantic), six gradients, and the shadow scale (light variants)
    - [x] `[data-theme='dark']` block declaring the same token names with dark values and darker shadows
  - [x] Gradient tokens MUST reference other tokens via `var(...)` (not raw hex) so they switch with theme
  - [x] File-level comment block explains: "Single source of truth for visual language — no raw hex/spacing in JSX or component CSS (NFR-V1)."

- [x] **Task 3: Wire Tailwind `@theme inline`** (AC: #1, #7)
  - [x] In `web/src/index.css` (keep the file; rewrite its contents):
    - [x] Line 1: `@import "./design/tokens.css";`
    - [x] Line 2: `@import "tailwindcss";`
    - [x] Add `@theme inline { ... }` block that maps every token to a Tailwind theme slot:
      - `--color-surface-primary: var(--color-surface-primary);` (and friends)
      - `--color-accent-glow: var(--color-accent-glow);` (and friends)
      - `--spacing-*: var(--space-*);` (Tailwind's `@theme` uses the `--spacing-` prefix for utilities like `p-4`; note the rename)
      - `--radius-*: var(--radius-*);`
      - `--shadow-*: var(--shadow-*);` (Tailwind recognises this prefix for shadow utilities)
    - [x] Replace placeholder styles (`h1 { font-weight: 600; letter-spacing: -0.02em; }`, `main { display: grid; place-items: center; min-height: 100vh; padding: 2rem; }`) with token-based base rules:
      - `body { background: var(--color-surface-primary); color: var(--color-text-primary); margin: 0; min-height: 100vh; }`
      - Layout for `main` can use Tailwind utilities in `App.tsx` instead of global rules; if kept global, use `padding: var(--space-8)` etc.
  - [x] Verify `bg-surface-primary`, `text-accent-glow`, `shadow-elevated`, `rounded-md`, `p-4` all resolve correctly at runtime

- [x] **Task 4: Implement theme.ts** (AC: #8)
  - [x] Create `web/src/design/theme.ts` with the exported surface specified in AC #8
  - [x] Use `const STORAGE_KEY = 'latestnews:theme'`
  - [x] Use `const VALID_MODES = ['light', 'dark', 'system'] as const` for type narrowing + defensive runtime validation of localStorage content (corrupted storage → treat as 'system')
  - [x] Do **NOT** throw from `applyInitialTheme` — it runs before React mounts; a throw means blank screen. Log-and-continue (console.warn is allowed here because the Biome rule is `noConsole: error` but `console.warn` in a module specifically about runtime boot is defensible; if Biome flags it, use `// biome-ignore lint/suspicious/noConsole: boot diagnostic is intentional` above the single call)
  - [x] SSR-safe by design — check `typeof window !== 'undefined'` and `typeof localStorage !== 'undefined'` once at module top or inside the function. For a client-only Vite SPA this is belt-and-braces; do it anyway so `theme.ts` is reusable in a future SSR story without rewrite
  - [x] Media-query listener uses `addEventListener('change', handler)` (the legacy `addListener` is deprecated and triggers Biome lint noise)

- [x] **Task 5: Wire theme apply at boot** (AC: #9, #10)
  - [x] Edit `web/src/main.tsx`:
    - [x] Add `import { applyInitialTheme } from './design/theme'`
    - [x] Call `applyInitialTheme()` as the first executable statement after imports (before `document.getElementById('root')`)
  - [x] Verify in the browser devtools: `document.documentElement.dataset.theme === 'light'` (or `'dark'` if OS is dark) before React has rendered

- [x] **Task 6: Contrast / a11y documentation** (AC: #14)
  - [x] Create `web/src/design/tokens.md` with a small Markdown table:
    - [x] Columns: Token, Light theme, Dark theme, Ratio vs. surface-primary, WCAG level
    - [x] Rows for: `--color-text-primary`, `--color-text-muted`, `--color-text-subtle`, `--color-text-inverted` on `--color-accent-deep`
    - [x] Reproduce the numbers verbatim from the UX spec (16.5:1 / 7.8:1 / 4.8:1 for light; 14.8:1 / 6.2:1 / 4.6:1 for dark)

- [x] **Task 7: Author contract tests for tokens** (AC: #12)
  - [x] Create `web/src/design/__tests__/tokens.test.ts`
  - [x] `import tokensCss from '../tokens.css?raw'` (Vite `?raw` loader returns the file as a string)
  - [x] For each expected token name, assert `tokensCss.includes('--color-surface-primary')` etc. Use a single `describe` with a parameterised test (`test.each`) over the full list of expected tokens — keeps the test readable as the list grows
  - [x] Also assert that each colour token appears **twice** (once per theme block) — regex-count the occurrences of each name
  - [x] Assert that the file contains both `[data-theme='light']` and `[data-theme='dark']` selectors

- [x] **Task 8: Author theme.ts tests** (AC: #13)
  - [x] Create `web/src/design/__tests__/theme.test.ts`
  - [x] Use `beforeEach` to reset `localStorage`, `document.documentElement.dataset.theme`, and re-stub `window.matchMedia`
  - [x] Write tests for each of AC #13's five scenarios; each assertion checks both `localStorage.getItem(...)` **and** `document.documentElement.dataset.theme`
  - [x] For the media-query listener test, simulate a `change` event by calling the captured handler with `{ matches: true }` and assert `data-theme` flipped

- [x] **Task 9: End-to-end validation** (AC: #1, #7, #10, #15)
  - [x] `npm run lint` passes (Biome + Ruff)
  - [x] `npm run typecheck` passes (tsc strict + mypy strict)
  - [x] `npm run test` passes (Vitest + pytest)
  - [x] `npm run dev`: browser shows "Hello LatestNews" with correct surface / text colours in both OS theme modes. Toggle via devtools: `document.documentElement.dataset.theme = 'dark'` → visible flip
  - [x] Devtools: element inspection of any token-consuming class (e.g. `<body>`) shows the CSS custom property resolving to the expected hex

- [x] **Task 10: Commit + push + CI verify** (AC: #15)
  - [x] Stage all new/modified files
  - [x] Conventional Commits message: `feat(design): implement design tokens + theme infrastructure (Story 1.2)`
  - [x] Commit body lists the token categories shipped and confirms scope discipline (no typography, no motion runtime, no shadcn)
  - [x] Push to `origin/dev`
  - [x] Verify GitHub Actions CI run is green (all 3 jobs)

## Dev Notes

### Scope and altitude

This story ships **only the token vocabulary**. No components consume tokens yet beyond `<body>` and `<h1>` in the scaffold. Do **not** touch:

- **Typography tokens, Inter/JetBrains Mono fonts, type scale** — **Story 1.3**.
- **Motion tokens (durations/easings/variants), `motion.ts`, Motion library install** — **Story 1.4** (co-ships with shadcn/ui because the first components that need motion are shadcn's).
- **shadcn/ui components (Button, Dialog, etc.), Radix integration** — **Story 1.4**.
- **Routing (React Router), AppShell layout, theme-toggle button UI, Cmd-K, keyboard overlay** — **Story 1.5**.

The user-visible outcome is modest: "Hello LatestNews" now reads in the token-derived colour palette and respects OS theme preference. The **platform effect** is major: every subsequent story has a cohesive vocabulary to spend.

### Architecture source of truth

- **Full architecture:** `!DOCS/planning-artifacts/architecture.md` (1 141 lines).
- **Styling stack decision (§ Frontend Architecture):** Tailwind CSS v4 with semantic tokens declared in the `@theme` layer.
- **Token source-of-truth rule (§ Frontend Architecture):** "Design token source. CSS custom properties in `web/src/design/tokens.css`, consumed by both the Tailwind config and components. Single source; dark/light parity required."
- **Directory layout (§ Project Structure & Boundaries → `web/src/`):**
  ```
  web/src/
  ├─ design/
  │  ├─ tokens.css
  │  ├─ theme.ts
  │  ├─ motion.ts          (Story 1.4)
  │  └─ typography.ts      (Story 1.3)
  ```
- **Naming convention (§ Implementation Patterns & Consistency Rules):** CSS custom properties use `--kebab-case` with semantic prefix (`--color-surface-primary`, `--space-4`). Tailwind semantic classes derive from tokens via `@theme` — no raw hex / spacing values allowed in JSX.
- **No React logic in design modules (§ Implementation Patterns):** "Design components (tokens, motion) have no React logic — pure CSS/JS exports."

### UX source of truth

- **Full UX spec:** `!DOCS/planning-artifacts/ux-design-specification.md` (1 725 lines).
- **Design direction:** "The Atrium" — generous spacing, persistent chat panel, ambient mini-graph, rich atmospheric gradients, neon-green signature (`--color-accent-glow`), dark-blue-to-neon-green gradient family.
- **Relevant sections:**
  - § Visual Design Foundation → Color System
  - § Visual Design Foundation → Spacing / Radius / Shadow Scales
  - § Visual Design Foundation → Theme Switching
  - § Accessibility Considerations → Color Contrast / Focus Ring / Reduced Motion

### PRD source of truth

- **Full PRD:** `!DOCS/planning-artifacts/prd.md` (623 lines).
- **NFRs in play this story:**
  - **NFR-V1** — tokenized design system, no raw hex / ad-hoc spacing / one-off shadow in component source.
  - **NFR-A2** — all text meets 4.5:1 contrast in both themes. Our token set ships light-primary 16.5:1 / dark-primary 14.8:1 by construction; we keep the table in `tokens.md`.
  - **NFR-A4** — `prefers-reduced-motion` honoured. This story defines no motion; the infrastructure still matters because a future motion story will assume the theme infrastructure is solid.
  - **NFR-A5** — axe-core / Lighthouse a11y zero errors. Scaffold has no a11y surfaces yet, but token-derived contrast is prerequisite.
  - **NFR-S1 / NFR-S2** — unchanged; no new network surfaces in this story.
  - **NFR-Q4** — `AGENTS.md` updated: add one bullet under "Repository layout" mentioning `web/src/design/` as the token source of truth. Do not expand further.
  - **NFR-Q6** — commit attributable to Story 1.2.
- **FR that this story enables but does not implement:** **FR42** (theme toggle UI) — Story 1.5.

### Key technical decisions

- **Tailwind v4, not v3.** v4 has first-class support for `@theme` / `@theme inline` and no separate config file is needed. The `tailwind.config.js` mentioned in UX-DR2 is a v3-era artefact — **do not create it**. All theme configuration lives in CSS via `@theme { ... }`.
- **`@tailwindcss/vite`, not PostCSS.** Tailwind v4's Vite plugin is faster and needs zero PostCSS config; architecture's "Vite + Tailwind" decision is explicit about using the plugin path.
- **`@theme inline` for token vars.** Because tokens switch between light/dark, the `@theme` block must use `inline` so Tailwind reads the value at use-site (through `var()`), not at config-compile time. Without `inline`, dark mode wouldn't flip.
- **`[data-theme]` selector, not `class="dark"`.** The UX spec is explicit: `[data-theme='light']` and `[data-theme='dark']`. Tailwind v4 supports this via `@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));` if you want a `dark:` variant — **add this one line to `index.css`** so future stories can write `dark:bg-surface-primary` if they need theme-specific overrides. (They usually won't, because tokens flip automatically, but keep the door open.)
- **localStorage key: `latestnews:theme`.** Namespace prefix prevents collisions with future features.
- **Theme applied before React mounts.** `applyInitialTheme()` runs synchronously in `main.tsx` before `createRoot`. A CSS transition on `body` background during theme flip would then not trigger a flash. If you want a transition effect on *later* theme flips (e.g. the user toggling in Story 1.5), add `transition: background-color 220ms` on `body` — but the attribute mutation during boot is synchronous and happens before paint, so there is no initial flicker.
- **No animation on initial theme apply.** The paint-blocking style is deliberate. Subsequent `setTheme(...)` calls by the user can animate; the first apply is instant.
- **Gradients reference other tokens.** `--gradient-accent-diagonal: linear-gradient(135deg, var(--color-accent-deep) 0%, var(--color-accent-mid) 50%, var(--color-accent-glow) 100%)`. Defining gradients in terms of scalar tokens means they flip with theme for free, and a future palette change requires edits in one place only.

### Token value reference

This is the authoritative value list. Use it verbatim. If a value here differs from a value you find in the UX spec, **the spec wins** — cross-check before implementing.

#### Spacing scale (theme-invariant)

| Token | px |
|-------|-----|
| `--space-0` | 0 |
| `--space-0_5` | 2 |
| `--space-1` | 4 |
| `--space-1_5` | 6 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |
| `--space-10` | 40 |
| `--space-12` | 48 |
| `--space-16` | 64 |
| `--space-20` | 80 |
| `--space-24` | 96 |

#### Radius scale (theme-invariant)

| Token | value |
|-------|-----|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

#### Colour tokens — light theme

Accent family: `--color-accent-deep: #0F2C4D`, `--color-accent-mid: #1A7A8B`, `--color-accent-glow: #0DFFAE`, `--color-accent-hover: #0B2140`, `--color-accent-pressed: #072038`, `--color-accent-subtle-bg: #DEFBF0`, `--color-accent-subtle-text: #006B4D`, `--color-accent-ring: #0DFFAE`.

Surface: `--color-surface-primary: #FFFFFF`, `--color-surface-secondary: #F7F8FA`, `--color-surface-tertiary: #EEF0F4`, `--color-surface-overlay: rgba(255,255,255,0.95)`.

Text: `--color-text-primary: #0F1419` (16.5:1), `--color-text-muted: #4A5566` (7.8:1), `--color-text-subtle: #6E7889` (4.8:1), `--color-text-inverted: #FFFFFF`.

Border: `--color-border-subtle: #EEF0F4`, `--color-border-default: #D9DEE6`, `--color-border-strong: #A8B2C2`.

Semantic: `--color-success: #0C7A3E`, `--color-success-subtle-bg: #E2F7EB`, `--color-warning: #B86300`, `--color-warning-subtle-bg: #FDF0E0`, `--color-error: #B0293F`, `--color-error-subtle-bg: #FAE5EA`, `--color-info: #1A5EAB`.

#### Colour tokens — dark theme

Accent family: `--color-accent-deep: #0F2C4D`, `--color-accent-mid: #2D8A9B`, `--color-accent-glow: #14FFB4`, `--color-accent-hover: #1F3E66`, `--color-accent-pressed: #0F2C4D`, `--color-accent-subtle-bg: #0C1D22`, `--color-accent-subtle-text: #7CFFD5`, `--color-accent-ring: #14FFB4`.

Surface: `--color-surface-primary: #0A0D12`, `--color-surface-secondary: #11151C`, `--color-surface-tertiary: #171C25`, `--color-surface-overlay: rgba(10,13,18,0.95)`.

Text: `--color-text-primary: #E6E9EF` (14.8:1), `--color-text-muted: #9099A8` (6.2:1), `--color-text-subtle: #6B7380` (4.6:1), `--color-text-inverted: #0A0D12`.

Border: `--color-border-subtle: #1E232D`, `--color-border-default: #2A3240`, `--color-border-strong: #3F4A5E`.

Semantic: `--color-success: #4ACF7E`, `--color-success-subtle-bg: #0F2A1A`, `--color-warning: #F1A34A`, `--color-warning-subtle-bg: #2A1E0A`, `--color-error: #F0627A`, `--color-error-subtle-bg: #2E1419`, `--color-info: #6BA8F0`.

#### Gradient tokens

Both themes. Because each gradient is defined in terms of other tokens, the same gradient declaration works in both themes (no duplicate definitions needed — declare them once at `:root` after the theme-specific colour blocks).

```css
--gradient-accent-diagonal: linear-gradient(135deg, var(--color-accent-deep) 0%, var(--color-accent-mid) 50%, var(--color-accent-glow) 100%);
--gradient-accent-vertical: linear-gradient(180deg, var(--color-accent-subtle-bg) 0%, transparent 100%);
--gradient-accent-ring: conic-gradient(from 220deg at 50% 50%, var(--color-accent-deep), var(--color-accent-glow), var(--color-accent-deep));
--gradient-hero-space: radial-gradient(ellipse at 30% 20%, var(--color-accent-mid) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, var(--color-accent-glow) 0%, transparent 45%), var(--color-accent-deep);
--gradient-node-glow: radial-gradient(circle, var(--color-accent-glow) 0%, transparent 65%);
--gradient-citation-highlight: linear-gradient(180deg, transparent 60%, var(--color-accent-glow) 60%);
```

#### Shadow tokens

**Light theme:**

```css
--shadow-subtle: 0 1px 2px 0 rgba(15, 20, 25, 0.04), 0 1px 3px 0 rgba(15, 20, 25, 0.03);
--shadow-elevated: 0 4px 12px -2px rgba(15, 20, 25, 0.08), 0 2px 6px -2px rgba(15, 20, 25, 0.04);
--shadow-overlay: 0 24px 48px -12px rgba(15, 20, 25, 0.14), 0 8px 24px -8px rgba(15, 20, 25, 0.08);
--shadow-glow-accent: 0 0 0 1px var(--color-accent-glow), 0 0 12px 0 rgba(13, 255, 174, 0.55), 0 0 32px 0 rgba(13, 255, 174, 0.25);
--shadow-glow-accent-subtle: 0 0 8px 0 rgba(13, 255, 174, 0.18);
```

**Dark theme:**

```css
--shadow-subtle: 0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 1px 3px 0 rgba(0, 0, 0, 0.4);
--shadow-elevated: 0 4px 12px -2px rgba(0, 0, 0, 0.6), 0 2px 6px -2px rgba(0, 0, 0, 0.4);
--shadow-overlay: 0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 8px 24px -8px rgba(0, 0, 0, 0.5);
--shadow-glow-accent: 0 0 0 1px var(--color-accent-glow), 0 0 16px 0 rgba(20, 255, 180, 0.65), 0 0 40px 0 rgba(20, 255, 180, 0.35);
--shadow-glow-accent-subtle: 0 0 10px 0 rgba(20, 255, 180, 0.28);
```

Note that the glow shadows use raw RGB in the bloom layer intentionally — `var(--color-accent-glow)` can't be decomposed into `r,g,b` inside an `rgba()` at this time. The hex-to-rgb values above are pre-computed from `#0DFFAE` / `#14FFB4`. If the glow colour ever changes, update both the hex and the bloom-layer RGB triplets.

### File layout (story deliverables)

```
web/
├─ package.json                       # MODIFIED — add tailwindcss@^4, @tailwindcss/vite, vitest, RTL, happy-dom; test script
├─ package-lock.json                  # MODIFIED
├─ vite.config.ts                     # MODIFIED — tailwindcss() plugin + vitest config
├─ tsconfig.app.json                  # MODIFIED — add "vitest/globals" to types
└─ src/
   ├─ main.tsx                        # MODIFIED — applyInitialTheme() call before createRoot
   ├─ index.css                       # MODIFIED — @imports + @theme inline + token-based base
   ├─ App.css                         # unchanged (still the placeholder comment from Story 1.1)
   ├─ test-setup.ts                   # NEW — imports @testing-library/jest-dom/vitest
   └─ design/
      ├─ tokens.css                   # NEW — the 50+ CSS custom properties
      ├─ theme.ts                     # NEW — applyInitialTheme / setTheme / getTheme
      ├─ tokens.md                    # NEW — contrast ratio reference table
      └─ __tests__/
         ├─ tokens.test.ts            # NEW — Vitest contract test
         └─ theme.test.ts             # NEW — Vitest behaviour test
```

Also modify (outside `web/`):

- `AGENTS.md` — add one line under "Repository layout" linking to `web/src/design/`.

### Previous story intelligence (carry-over from Story 1.1)

Story 1.1 shipped the scaffold. Things that matter for this story:

- **Branch strategy:** `dev` is the integration branch; `main` is production. Work on `dev`, push to `origin/dev`, CI runs on both `dev` and `main`. Story 1.1 landed on `dev` but has not been merged to `main` yet — do not branch from `main`; pull `dev` as your base.
- **Biome v2 lint is active** with `suspicious/noConsole: error`. For `theme.ts` the single legitimate `console.warn` (on localStorage read failure) needs an inline `biome-ignore` comment; see Task 4.
- **Biome v2 `files.includes` syntax** is the correct translation of the v1 `ignore` pattern. Extend the include list only if you add new top-level dirs (you won't in this story).
- **Web tests no-op was a scaffolding choice.** Story 1.2 replaces it with a real Vitest runner. CI's `test` job picks up the change automatically — no CI-config edit needed.
- **Vite 8 / React 19 / TypeScript strict** are pinned via the Story 1.1 lockfile. Do not bump these.
- **The `noConsole: error` rule interacts with `theme.ts`.** The only legitimate `console.*` call in the module is `console.warn` on a parse failure of the stored theme value. Gate it with a `biome-ignore` comment. No other console calls allowed anywhere in this story's new code.
- **`main.tsx`'s null-check on `#root`** landed in Story 1.1 (replaces the template's non-null assertion). Preserve it when you add the `applyInitialTheme()` call.
- **CSS file organization:** Story 1.1 left `index.css` and `App.css` as placeholders. Replace `index.css` per Task 3; leave `App.css` alone (or reduce to a single-line comment — its content is already minimal).
- **Review findings from 1.1 that touch this story:** Code review recommended installing Vitest in the first story that actually needs it. That moment is now — AC #11 is the formal commitment.
- **CI cache race warning** from the 1.1 review is benign. New test dependencies increase `web/` `npm ci` time by ~10–15 s; this should still fit inside the current CI job timings (~20–25 s each). If CI slows meaningfully (>60 s per job), investigate — but do not preoptimise.

### Library / version pins

Let the lockfile be authoritative. Install the latest stable at implementation time. Expected at time of writing:

- `tailwindcss@^4` (latest stable; v4 ecosystem is mature as of early 2026)
- `@tailwindcss/vite@^4` (version lockstep with `tailwindcss`)
- `vitest@^3` (Vite 8 requires Vitest 3+)
- `@testing-library/react@^16` (React 19 compatible)
- `@testing-library/jest-dom@^6`
- `@testing-library/user-event@^14`
- `happy-dom@^17` (faster than jsdom for our needs; jsdom is fine too if happy-dom fails under Node 22)

If `@testing-library/react` issues a peer-dep warning on React 19, continue — it's usually a signalling lag in the RTL package.json and the library itself works fine.

### Known gotchas

- **`@theme` vs `@theme inline`.** Use `@theme inline { ... }` so Tailwind reads `var(--color-...)` at use-site. Plain `@theme { --color-foo: var(--color-bar); }` resolves the reference at build-time and flattens to a single static value — breaking dark mode.
- **Tailwind spacing uses `--spacing-` prefix, not `--space-`.** When mapping into `@theme inline`, map `--spacing-1: var(--space-1);` etc. This lets utilities like `p-1` (4 px) / `p-4` (16 px) resolve correctly. Keep the original `--space-*` names in `tokens.css` — Tailwind's prefix is an implementation detail of the utility generation.
- **Tailwind `bg-surface-primary` utility name.** With `--color-surface-primary` in `@theme inline`, Tailwind generates `bg-surface-primary`, `text-surface-primary`, `border-surface-primary`, `ring-surface-primary`, etc. Verify empirically for the three concrete classes the ACs call out (`bg-surface-primary`, `text-accent-glow`, `shadow-elevated`).
- **`happy-dom` + `matchMedia`.** `happy-dom` ships a partial `matchMedia` mock. For tests that exercise the media-query listener, stub it explicitly with `vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener, removeEventListener, ... })))`. Do not rely on the default.
- **CSS `?raw` imports need Vite.** The token contract test uses `import tokensCss from '../tokens.css?raw'`. Vitest running under Vite's transformer supports this natively. If you see a "cannot import `.css?raw`" error, the test config is wrong — check that Vitest is reading the main `vite.config.ts`.
- **FOUC risk if tokens load asynchronously.** `import './design/tokens.css'` at the top of `index.css` resolves at build time into a single CSS bundle — no async. If you somehow get a flash of default colour before tokens kick in, something is wrong with the import order.
- **`data-theme` must be on `<html>`, not `<body>`.** Some patterns put it on `body`; our CSS selectors target `[data-theme]` directly on `:root` / `html`. Apply via `document.documentElement.dataset.theme = ...`.
- **React 19 StrictMode double-invocation.** `applyInitialTheme()` is idempotent, but StrictMode in dev will invoke effects twice. Since the call is in `main.tsx` outside React (before `createRoot`), StrictMode doesn't affect it. If you later move the call into a React effect (don't, for the FOUC reason above), guard with `useRef` + `useEffect`.
- **Test snapshot brittleness.** Do **not** snapshot the entire `tokens.css` file — a single-character whitespace change fails the test without signal. Assert on token-name presence and value presence via specific substrings / regex.
- **AGENTS.md update scope.** Only add the one `web/src/design/` bullet. Do not start drafting the typography/motion/shadcn sections — those belong to their own stories.

### Testing standards summary

- **Frontend unit tests:** Vitest with happy-dom, run via `npm run test`. Two test files in this story (`tokens.test.ts`, `theme.test.ts`).
- **No E2E / a11y tests yet.** Playwright + axe tests land in Stories 1.5+ when there are actual routes to test. `tests/web/e2e/` and `tests/web/axe/` stay as `.gitkeep` for now.
- **Backend tests unchanged.** `tests/backend/test_health.py` still green; no backend changes this story.
- **Red-green-refactor applies to `theme.ts`.** Write the tests in Task 8 before the implementation in Task 4 is fully done — at least for the behavioural assertions. Token-presence contract tests (Task 7) can be authored alongside `tokens.css` since they're a one-to-one read of the file.

### Project Structure Notes

This story creates the `web/src/design/` subsystem for the first time. The directory exists in architecture.md's target tree; this is the first story to populate it. No conflicts or variances detected.

The `web/src/design/__tests__/` location co-locates tests with the module they test. This follows the frontend convention (TS co-location) rather than the backend convention (`tests/` sibling). Both patterns coexist intentionally per architecture § Project Structure.

### References

- Architecture — Frontend Architecture (styling stack decision): `!DOCS/planning-artifacts/architecture.md` § Frontend Architecture → Styling Solution
- Architecture — Token source of truth: `!DOCS/planning-artifacts/architecture.md` § Frontend Architecture → Design Token Source
- Architecture — Directory layout for `web/src/design/`: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries → Complete Project Directory Structure
- Architecture — Naming conventions for CSS custom properties: `!DOCS/planning-artifacts/architecture.md` § Implementation Patterns & Consistency Rules
- UX — "The Atrium" direction: `!DOCS/planning-artifacts/ux-design-specification.md` § Design Direction Decision
- UX — Color system values: `!DOCS/planning-artifacts/ux-design-specification.md` § Visual Design Foundation → Color System
- UX — Spacing / Radius / Shadow scales: `!DOCS/planning-artifacts/ux-design-specification.md` § Visual Design Foundation → Spatial & Elevation
- UX — Theme switching: `!DOCS/planning-artifacts/ux-design-specification.md` § Visual Design Foundation → Theme Switching
- UX — Accessibility considerations: `!DOCS/planning-artifacts/ux-design-specification.md` § Accessibility Considerations
- PRD — NFR-V1, NFR-A2, NFR-A4, NFR-A5, NFR-Q4, NFR-Q6: `!DOCS/planning-artifacts/prd.md` § Non-Functional Requirements
- PRD — FR42 (theme toggle, not implemented this story): `!DOCS/planning-artifacts/prd.md` § Functional Requirements
- Epics — Story 1.2 definition: `!DOCS/planning-artifacts/epics.md` § Epic 1 → Story 1.2
- Story 1.1 completion report (for carry-over context): `!DOCS/implementation-artifacts/1-1-bootstrap-the-monorepo-scaffold.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via Claude Code (BMad `bmad-dev-story` workflow).

### Debug Log References

- **Tailwind Vite plugin intercepts `.css?raw` imports** — returns empty strings. Switched the token-contract test to `fs.readFileSync` + `import.meta.url` path resolution.
- **Biome CSS formatter rewrites `'single'` to `"double"` quotes** by default. Aligned tokens.css, index.css, and test selectors on double quotes — semantically identical for CSS attribute selectors.
- **Biome 2 CSS parser rejects Tailwind directives by default.** Added `"css": { "parser": { "tailwindDirectives": true } }` to `biome.json`.
- **happy-dom 20's `localStorage` is incomplete.** Replaced with an in-memory `Map`-backed `Storage` mock stubbed onto `window.localStorage` per-test.
- **Tailwind v4's utility engine uses `--spacing-*`, not `--space-*`.** Aliased source-of-truth `--space-*` names into `--spacing-*` inside `@theme inline` while keeping UX-spec-aligned names in `tokens.css`.
- **`noConsole: error` required a single `biome-ignore`** on the legitimate `console.warn` in `theme.ts` (corrupt-localStorage diagnostic).
- **Initial `extractBlock` regex bug** — matched header-comment mentions of the selector. Switched to `selector + \s* + {` regex bound to actual CSS blocks.

### Completion Notes List

- **Scope held.** No typography (Story 1.3), no motion runtime (Story 1.4), no shadcn (Story 1.4), no routing / AppShell / theme-toggle UI (Story 1.5).
- **NFR-V1:** every rule in `index.css` uses `var(--…)`; no raw hex / pixel values in frontend source.
- **NFR-A2:** contrast ratios reproduced verbatim in `web/src/design/tokens.md`; every text/surface pair clears AA, primary text AAA in both themes.
- **NFR-Q4:** `AGENTS.md` gained a single nested bullet for `web/src/design/` — no other section touched.
- **Dev-parity verified end-to-end.** `npm run dev` launches both processes; Vite proxy works; served `index.css` bundle contains the full light + dark blocks plus Tailwind's `@layer theme` mirror.
- **Test count 1 → 75.** 1 backend health + 61 token-contract + 13 theme-behaviour.
- **Story 1.1 code-review finding M1 resolved** — web `test` script is a real Vitest runner now.

### File List

**New — design subsystem (`web/src/design/`)**

- `web/src/design/tokens.css`
- `web/src/design/theme.ts`
- `web/src/design/tokens.md`
- `web/src/design/__tests__/tokens.test.ts`
- `web/src/design/__tests__/theme.test.ts`

**New — test harness**

- `web/src/test-setup.ts`

**Modified — web**

- `web/package.json` (Tailwind v4 + Vitest + RTL + happy-dom deps; `test` → `vitest run`; added `test:watch`)
- `web/package-lock.json`
- `web/vite.config.ts` (added `tailwindcss()` plugin + Vitest config + `vitest/config` triple-slash reference)
- `web/tsconfig.app.json` (added `"vitest/globals"` and `"node"` to `types`)
- `web/src/main.tsx` (calls `applyInitialTheme()` before `createRoot`)
- `web/src/index.css` (tokens import + Tailwind import + `@custom-variant` dark + `@theme inline` map + token-based base styles)

**Modified — root**

- `biome.json` (added `css.parser.tailwindDirectives: true`)
- `AGENTS.md` (one nested bullet pointing at `web/src/design/`)

**Modified — planning artefacts**

- `!DOCS/implementation-artifacts/1-2-implement-design-tokens.md` (status, task checkboxes, Dev Agent Record)
- `!DOCS/implementation-artifacts/sprint-status.yaml` (1-2 → in-progress → review)

### Change Log

| Date       | Change                                                                                                    |
|------------|-----------------------------------------------------------------------------------------------------------|
| 2026-04-18 | Status → `in-progress`. Created `web/src/design/` subsystem.                                              |
| 2026-04-18 | Tasks 1–10 implemented; 74 web + 1 backend tests green; status → `review` on commit.                      |

### Change Log

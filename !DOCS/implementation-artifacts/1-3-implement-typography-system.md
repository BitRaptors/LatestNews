# Story 1.3: Implement typography system (Inter + JetBrains Mono with full type scale)

Status: review

## Story

As a developer,
I want Inter and JetBrains Mono self-hosted with the complete type scale wired through CSS custom properties and Tailwind's `@theme inline`,
so that every subsequent component renders tokenized typography with no external font-CDN traffic (NFR-S2).

## Acceptance Criteria

1. **Font packages installed and self-hosted.** `web/` has `@fontsource/inter` and `@fontsource/jetbrains-mono` as dependencies. No network requests to fonts.googleapis.com / Adobe Typekit / any CDN on first paint — verified by inspecting network panel.

2. **`web/src/design/typography.ts` imports the needed weights.** The module imports Inter weights `400`, `500`, `600`, `700` and JetBrains Mono weight `400` via `@fontsource/*/{weight}.css` subpath imports. The module has no runtime logic and no React — its entire purpose is to pull the `@font-face` declarations into the bundle.

3. **`typography.ts` is imported from `main.tsx` before React mounts.** The import sits alongside the existing `./design/theme` import so font `@font-face` rules are in the bundle by the first paint, avoiding a visible swap on the "Hello LatestNews" header.

4. **Font-family, weight, size, line-height, and letter-spacing tokens exist in `tokens.css`.** All typography tokens live under `:root` (theme-invariant). Exact names:
   - **Family:** `--font-family-sans`, `--font-family-mono`.
   - **Weight:** `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700).
   - **Type scale (12 tokens):** `--font-size-<role>` + `--line-height-<role>` + `--letter-spacing-<role>` for each of: `display-1`, `display-2`, `heading-1`, `heading-2`, `heading-3`, `body-lg`, `body`, `body-sm`, `label`, `caption`, `mono`, `mono-sm`. Use the exact values from Dev Notes → Token value reference.

5. **Letter-spacing values use `em` units, not percentages.** CSS `letter-spacing` does not accept `%`; the spec's percentage notation (`-1.5%`, `-1.0%`, `+1%`, `+2%`) is converted to `em` at token declaration time (`-0.015em`, `-0.01em`, `0.01em`, `0.02em`). Zero values are `0` (unitless is fine).

6. **Tailwind utilities resolve for every type-scale role.** After `@theme inline` mapping, applying `text-display-1`, `text-heading-2`, `text-body`, `text-caption`, `text-mono-sm`, `font-sans`, `font-mono`, `font-semibold`, etc. on any element renders the correct size/line-height/weight/family. Paired font-size utility also applies its line-height (via Tailwind v4's `--text-<name>--line-height` sub-property convention).

7. **`font-sans` is the default family on `<body>`.** `index.css` sets `body { font-family: var(--font-family-sans); }` (or applies `font-sans` via `@apply` or a base rule) so any text without an explicit family class renders in Inter. Monospace renders via `font-mono` class where needed (not by default).

8. **App.tsx demonstrates typography.** `web/src/App.tsx` applies `className="text-heading-1 font-semibold"` (or equivalently `text-display-2`) to the `<h1>`. The browser shows the heading in the correct size, line-height, weight, and Inter family. This is the visible proof the typography system is wired.

9. **Token contract tests extended.** `web/src/design/__tests__/tokens.test.ts` gains parameterised `TYPOGRAPHY_*` tests asserting presence of every font-family / font-weight / font-size / line-height / letter-spacing token in `tokens.css`. Vitest counts `test.each` cases as individual tests, so the expected delta is **~19 new Vitest cases** (2 family + 4 weight + 12 roles × 1 parameterised case each checks all 3 paired props internally + 2 family-identity regexes). Existing colour / spacing / radius / shadow tests remain unchanged.

10. **No FOIT on reload.** With `@fontsource`'s default `font-display: swap`, system fonts render first and Inter swaps in when ready. Verify in the browser: open devtools' Rendering → Font display swaps, reload, confirm the heading is visible throughout (no invisible-text flash). This is a manual check; no automated test required.

11. **Lint / typecheck / test all green, CI included.** `npm run lint`, `npm run typecheck`, `npm run test` at repo root pass. GitHub Actions CI green on the resulting `dev` commit.

## Tasks / Subtasks

- [x] **Task 1: Install `@fontsource/*` packages in `web/`** (AC: #1)
  - [x] `cd web && npm install @fontsource/inter @fontsource/jetbrains-mono`
  - [x] Verify the packages ship local `.woff2` files by listing `web/node_modules/@fontsource/inter/files/` — should contain `inter-latin-*.woff2` (and other subsets)
  - [x] No change to any other dependency

- [x] **Task 2: Author `web/src/design/typography.ts`** (AC: #2)
  - [x] Create the file with side-effect-only font imports:
    ```ts
    import '@fontsource/inter/400.css'
    import '@fontsource/inter/500.css'
    import '@fontsource/inter/600.css'
    import '@fontsource/inter/700.css'
    import '@fontsource/jetbrains-mono/400.css'
    ```
  - [x] Header docstring notes: "Self-hosted fonts — NFR-S2. No external CDN requests. Weights selected per UX Design Spec § Visual Foundation → Typography."
  - [x] Do **NOT** add runtime code (no exports, no functions). The only purpose is to cause the bundler to resolve the `.css` files into the bundle.

- [x] **Task 3: Add typography tokens to `web/src/design/tokens.css`** (AC: #4, #5)
  - [x] Add a new section at `:root` (theme-invariant — fonts don't flip with theme) **after** the radius block. Use `em` units for letter-spacing; use `px` for sizes and line-heights (NOT rem — sizes are fixed per UX spec).
  - [x] Declare tokens in the exact order listed in Dev Notes → Token value reference. File-level comment for the new section: `/* ---------- Typography (NFR-V1, NFR-A2) ---------- */`.
  - [x] Do not introduce per-theme typography variants — the type scale is identical in light and dark.

- [x] **Task 4: Map typography tokens in `@theme inline`** (AC: #6, #7)
  - [x] In `web/src/index.css` under the existing `@theme inline { ... }` block, add:
    - [x] `--font-sans: var(--font-family-sans);` (generates `font-sans` utility)
    - [x] `--font-mono: var(--font-family-mono);` (generates `font-mono` utility)
    - [x] For each role (`display-1`, `display-2`, `heading-1`, `heading-2`, `heading-3`, `body-lg`, `body`, `body-sm`, `label`, `caption`, `mono`, `mono-sm`):
      - `--text-<role>: var(--font-size-<role>);`
      - `--text-<role>--line-height: var(--line-height-<role>);`
      - `--text-<role>--letter-spacing: var(--letter-spacing-<role>);` *(only when non-zero — omit for roles with `0` letter-spacing to avoid unnecessary cascade cost; Tailwind treats absent sub-props as "no override")*
    - [x] Font-weight Tailwind defaults (`font-normal`/`font-medium`/`font-semibold`/`font-bold`) already map to `400`/`500`/`600`/`700`. Do **not** shadow them; our values coincide.
  - [x] Add a base rule: `body { font-family: var(--font-family-sans); }` so text without `font-*` class still renders Inter.
  - [x] Verify empirically: `bg-surface-primary text-body font-semibold` applied on a `<div>` compiles and renders correctly.

- [x] **Task 5: Import `typography.ts` from `main.tsx`** (AC: #3)
  - [x] Add `import './design/typography'` next to the existing `import { applyInitialTheme } from './design/theme'` line.
  - [x] The import has no exports — its effect is bundling the `@font-face` CSS.
  - [x] Re-run `npm run dev` and confirm the bundle includes font files (network tab shows `inter-*.woff2` requests resolved from `/node_modules/...` — never from a remote host).

- [x] **Task 6: Apply a typography utility in `App.tsx`** (AC: #8)
  - [x] Change `<h1>Hello LatestNews</h1>` to `<h1 className="text-heading-1 font-semibold">Hello LatestNews</h1>`.
  - [x] Wrap in `<main className="grid place-items-center min-h-screen p-8">` if you want to preserve the centered layout previously expressed in global CSS — now it's a Tailwind class, matching the Story 1.2 review guidance (no layout-via-global-CSS).
  - [x] Alternative heading sizes are acceptable (`text-display-2` for a more dramatic scale) — pick one and document the choice in the commit body.

- [x] **Task 7: Extend token contract tests** (AC: #9)
  - [x] In `web/src/design/__tests__/tokens.test.ts`:
    - [x] Add `TYPOGRAPHY_FAMILY_TOKENS = ['--font-family-sans', '--font-family-mono']`
    - [x] Add `TYPOGRAPHY_WEIGHT_TOKENS = ['--font-weight-regular', '--font-weight-medium', '--font-weight-semibold', '--font-weight-bold']`
    - [x] Add `TYPOGRAPHY_SCALE_ROLES = ['display-1', 'display-2', 'heading-1', 'heading-2', 'heading-3', 'body-lg', 'body', 'body-sm', 'label', 'caption', 'mono', 'mono-sm']`
    - [x] Parameterised assertions that for each role, the file contains `--font-size-<role>`, `--line-height-<role>`, AND `--letter-spacing-<role>`
    - [x] The `:root` block is theme-invariant so no per-theme assertion is needed (test at file level with `tokensCss.includes(token)`)
  - [x] Ensure total expected test count: 74 pre-1.3 + 42 new = **116 total** (approximate; re-count after authoring).

- [x] **Task 8: Dev-server visual check** (AC: #10, #8)
  - [x] `npm run dev` at repo root
  - [x] Open `http://127.0.0.1:5173`. The heading reads "Hello LatestNews" in Inter, bold (600), size 24 px for heading-1 (or 36 px if you picked display-2)
  - [x] Open devtools Rendering → Emulate focus → Reload → confirm no invisible-text flash
  - [x] Network tab → filter `.woff2` → every request is to `localhost:5173` (relative), never to `fonts.googleapis.com` / `typekit.net` / any CDN
  - [x] Toggle `data-theme` on `<html>` in devtools and confirm typography unchanged — fonts survive theme flip

- [x] **Task 9: Lint / typecheck / test / CI** (AC: #11)
  - [x] `npm run lint` (Biome + Ruff)
  - [x] `npm run typecheck` (tsc strict + mypy strict)
  - [x] `npm run test` (Vitest + pytest)
  - [x] All green. Expected test count: ~116 web + 1 backend = 117 total (confirm actual count post-Task 7)

- [x] **Task 10: Commit + push + CI verify** (AC: #11)
  - [x] Conventional Commits message: `feat(design): implement typography system with Inter + JetBrains Mono (Story 1.3)`
  - [x] Commit body lists the roles added and confirms scope discipline (no motion, no shadcn, no AppShell)
  - [x] Push to `origin/dev`
  - [x] Verify GitHub Actions CI is green on the resulting commit
  - [x] Run `superpowers:requesting-code-review` on the commit range (per `AGENTS.md` § Per-story workflow)

## Dev Notes

### Scope and altitude

Story 1.3 ships **token infrastructure + font loading** — nothing else. The only visual change is that "Hello LatestNews" now renders in Inter at a type-scale token instead of the system font. Deliberately out of scope:

- **Motion tokens (durations, easings, `glow-breathe`, `stagger`, etc.) and `motion.ts`** — **Story 1.4**.
- **Motion library install (`motion` / framer-motion)** — **Story 1.4**.
- **shadcn/ui components (Button, Input, Dialog, Tabs, Tooltip, etc.)** — **Story 1.4**. These will consume typography tokens from Story 1.3, but installing them here would be scope creep.
- **Routing, AppShell layout, theme-toggle button UI, Cmd-K palette, `?` help overlay** — **Story 1.5**.
- **Responsive typography** — post-MVP (desktop-only per UX spec).
- **Font subsetting** — post-MVP; unicode-range subsetting is an optimization that needs empirical bundle analysis, not a pre-emptive guess.
- **OpenType feature tuning (ss01 etc.)** — post-MVP; Inter defaults are acceptable.
- **`font-display: optional`** — defer. `@fontsource` defaults to `swap`, which the PRD does not forbid.

### Architecture source of truth

- **Architecture full document:** `!DOCS/planning-artifacts/architecture.md`.
- **Token layer (including `typography.ts`):** architecture § Frontend Architecture → Design Token Source, and § Project Structure & Boundaries → `web/src/design/`.
- **Web App directory structure:**
  ```
  web/src/design/
  ├─ tokens.css       # extended in this story with typography CSS vars
  ├─ theme.ts         # Story 1.2 (theme mode apply/set/get — no edits here this story)
  ├─ typography.ts    # NEW this story — side-effect font imports
  ├─ motion.ts        # Story 1.4
  ├─ tokens.md        # Story 1.2 — optionally extend with font-weight table if time permits
  └─ __tests__/       # Story 1.2; tokens.test.ts extended here
  ```
- **Implementation patterns (§ Implementation Patterns & Consistency Rules):**
  - CSS custom properties: `--kebab-case` with semantic prefix (`--font-size-body`, `--line-height-heading-1`).
  - No inline `style={{ fontSize: '15px' }}` — use Tailwind utility or an `@apply` base rule.
  - No raw `px` in JSX for typography values.

### UX source of truth

- **UX spec full document:** `!DOCS/planning-artifacts/ux-design-specification.md`.
- **Relevant sections:**
  - § Visual Design Foundation → Typography (the authoritative type-scale table)
  - § Accessibility Considerations → Typography min-sizes and reader comfort
- **"The Atrium" identity signal:** the UX spec calls out typography as a "leading signal of consumer-SaaS polish" — generous body size (15/22 or 17/26 for reader-facing), proper letter-spacing at display and caption sizes, Inter at the full weight range. If the heading looks "off" visually after implementation, re-check letter-spacing conversion (`%` → `em`) before anything else.

### PRD source of truth

- **PRD full document:** `!DOCS/planning-artifacts/prd.md`.
- **NFRs in play:**
  - **NFR-V1** — tokenized design system. Typography extends the Story 1.2 rule: no `style={{ fontSize }}`, no raw `px` in JSX, no hardcoded `font-family`.
  - **NFR-V3** — consumer-SaaS visual quality. Typography is a leading signal; correct scale + correct letter-spacing + Inter at the right weights carries this.
  - **NFR-A2** — 4.5 : 1 contrast. Typography tokens define *scale*, not *colour*; combined with Story 1.2's text tokens they still clear AA / AAA. No regression expected.
  - **NFR-A5** — axe / Lighthouse clean. Correct semantic markup (`<h1>` → `heading-1` utility, `<p>` → `body`) cooperates with automation checks.
  - **NFR-S2** — **no outbound traffic.** `@fontsource` self-hosts; the story's Task 8 explicitly verifies no CDN requests. This is the single hardest-to-catch regression: a misconfigured import pattern could accidentally pull from a Google Fonts URL. Task 1 sanity-check (listing `node_modules/@fontsource/inter/files/`) is the first line of defence.
  - **NFR-Q4** — `AGENTS.md` update: one-line addition under "Repository layout" → `web/src/design/` bullet can note that typography/motion/theme modules live alongside tokens. Or skip if the bullet is already general enough (it is, from 1.2).
  - **NFR-Q6** — commit references Story 1.3.

### Key technical decisions

- **Pixel-based type scale, not rem.** The UX spec gives fixed pixel values (15 px body, 17 px body-lg, etc.). Converting to rem would couple typography to the user-agent root-font-size, which is a desktop-only app where we want pixel parity. Use `px` values as-is.
- **Letter-spacing in `em`, not `px`.** `em` scales with font-size and is the idiomatic CSS unit for tracking. Percentages from Figma convert 1-to-100: `-1.5%` → `-0.015em`.
- **Paired font-size + line-height + letter-spacing via Tailwind v4 sub-property syntax.** `--text-<role>--line-height` and `--text-<role>--letter-spacing` let a single utility (`text-body`) apply all three — no `leading-body` / `tracking-body` needed in the class list. Documented at <https://tailwindcss.com/docs/font-size> (v4) under "Providing a default line-height."
- **`font-weight` tokens match Tailwind defaults.** Inter weights 400/500/600/700 correspond to Tailwind's `font-normal`/`font-medium`/`font-semibold`/`font-bold`. No remapping needed — use the defaults.
- **Font-family tokens override Tailwind defaults.** `--font-sans: var(--font-family-sans);` in `@theme inline` replaces Tailwind's default (`ui-sans-serif, system-ui, ...`) with Inter (with a fallback chain). Apply the fallback inside `--font-family-sans` itself: `'Inter', ui-sans-serif, system-ui, sans-serif`. The fallback protects against FOIT if `@fontsource` ever fails to load.
- **Mono family fallback:** `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace`.
- **No `@font-face` handwritten rules.** `@fontsource` provides them pre-built; `typography.ts` importing the `.css` files brings them into the bundle. Writing custom `@font-face` would bypass the self-hosting guarantee.
- **`typography.ts` is side-effect-only.** No exports, no React hooks, no functions. If a future story needs to enumerate loaded weights, add a separate `typography-manifest.ts` at that time. Keep this module focused.

### Token value reference

This is the authoritative numeric truth for the type scale. Use exactly these values; cross-check against UX spec on any discrepancy.

#### Font families

```css
--font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

#### Font weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Type scale (12 roles × 3 props = 36 tokens)

| Role | `--font-size-*` | `--line-height-*` | `--letter-spacing-*` | Paired weight hint |
|------|----------------|-------------------|----------------------|--------------------|
| `display-1` | 48px | 56px | -0.015em | 700 (bold) |
| `display-2` | 36px | 44px | -0.01em  | 700 (bold) |
| `heading-1` | 24px | 32px | -0.005em | 600 (semibold) |
| `heading-2` | 20px | 28px | -0.005em | 600 (semibold) |
| `heading-3` | 17px | 24px | 0        | 600 (semibold) |
| `body-lg`   | 17px | 26px | 0        | 400 (regular) |
| `body`      | 15px | 22px | 0        | 400 (regular) |
| `body-sm`   | 13px | 18px | 0        | 400 (regular) |
| `label`     | 13px | 18px | 0.01em   | 500 (medium) |
| `caption`   | 12px | 16px | 0.02em   | 500 (medium) |
| `mono`      | 13px | 20px | 0        | 400 (regular) — family `mono` |
| `mono-sm`   | 11px | 16px | 0        | 400 (regular) — family `mono` |

**Note:** Paired weights are *suggestions* per UX spec; components pick the weight they need. The token layer does not bind a weight to a size — `text-display-1 font-semibold` is valid if the UX calls for it.

### File layout (story deliverables)

```
web/
├─ package.json                       # MODIFIED — @fontsource/inter, @fontsource/jetbrains-mono
├─ package-lock.json                  # MODIFIED
└─ src/
   ├─ main.tsx                        # MODIFIED — import ./design/typography
   ├─ index.css                       # MODIFIED — typography @theme inline + body font-family
   ├─ App.tsx                         # MODIFIED — h1 gets text-heading-1 font-semibold
   └─ design/
      ├─ tokens.css                   # MODIFIED — typography CSS vars added at :root
      ├─ typography.ts                # NEW — side-effect font imports
      └─ __tests__/
         └─ tokens.test.ts            # MODIFIED — TYPOGRAPHY_TOKENS contract tests added
```

No backend changes. No `theme.ts` changes (font loading has no interaction with theme switching — fonts are theme-invariant).

### Previous-story intelligence (carry-over)

- **Branch strategy:** `dev` is the integration branch; `main` is production. Work on `dev`; don't branch from `main` directly. As of Story 1.3 start, `main` == `dev` (just merged PR #1 for Stories 1.1 + 1.2).
- **Biome CSS formatter** uses double quotes. Stay consistent in `tokens.css` — wrap font family names in single quotes inside the value (Inter is a CSS identifier convention: `'Inter'` is safer than `"Inter"` inside a CSS property value to avoid shell-escaping pain in any generated output, but both work in the browser).
- **Biome `noConsole: error`** — no console calls in `typography.ts`; it's imports only, so non-issue.
- **Tailwind v4 `@theme inline`** — the `inline` keyword is required for values that resolve through `var()`. Typography tokens are static (theme-invariant) so you could technically use `@theme { --text-body: 15px; }` instead of `@theme inline { --text-body: var(--font-size-body); }`. **Prefer the inline-through-var form** so the token-source invariant holds: `tokens.css` is the single declaration site; `index.css` is the Tailwind alias layer.
- **Vitest + happy-dom** — the existing test infrastructure from Story 1.2 already handles `web/src/design/__tests__/*.test.ts`. No test-config changes needed.
- **`fs.readFileSync` in contract test** — the Tailwind plugin intercepts `?raw` imports, so the test reads `tokens.css` directly via `fs`. Extending that same pattern for typography assertions is correct.
- **CSS custom property naming** — stick with `--font-size-body` / `--line-height-body` / `--letter-spacing-body` for source-of-truth. Tailwind's expected naming (`--text-body`, `--text-body--line-height`, `--text-body--letter-spacing`) is an *alias* that lives only in `@theme inline`.

### Library / version pins

Let the lockfile be authoritative. Install latest stable at implementation time. Expected:

- `@fontsource/inter@^5` (provides weights 100–900 as sub-path imports; ships `.woff2` locally)
- `@fontsource/jetbrains-mono@^5`

No other new dependencies. Tailwind v4 / Vitest 4 / React 19 are already in place from Stories 1.1 and 1.2.

### Known gotchas

- **`@fontsource` subpath imports are `.css` files, not font files.** `import '@fontsource/inter/400.css'` pulls in a CSS file that declares `@font-face` with `src: url('./files/inter-latin-400-normal.woff2')`. The bundler resolves those relative `url()` paths to the actual font files. **Do not `import '@fontsource/inter'`** (the root — it would import every weight and subset, adding ~5× the payload).
- **Paired line-height syntax requires the double-dash.** Tailwind v4 reads `--text-<name>--line-height` (note the double `--`) as a sub-property of `--text-<name>`. Single-dash variants do NOT work. Verify with a smoke check: apply `class="text-body"` (no explicit `leading-*`) and confirm line-height is 22 px in devtools.
- **`font-family` value quoting.** Use single quotes inside CSS values: `'Inter'`, not `"Inter"`, to avoid escaping when Biome formats the file. Both are valid CSS.
- **Letter-spacing zero values.** Do NOT emit `--letter-spacing-body: 0em` — prefer unitless `0`. Both are valid; unitless is shorter and matches idiomatic CSS. For roles with zero letter-spacing, you can *omit* the corresponding `--text-<role>--letter-spacing` Tailwind alias entirely (Tailwind treats absent sub-props as "no override") — slightly smaller CSS bundle.
- **`font-display: swap` and layout shift.** Inter and system fonts have similar metrics, so layout shift on swap is small. If a future design needs zero layout shift, investigate `size-adjust` / `ascent-override` in `@font-face` (requires custom declarations rather than `@fontsource` defaults). Do not chase this in Story 1.3.
- **`text-heading-1` vs `text-2xl font-semibold`.** Tailwind defaults include utilities like `text-2xl`. Our named-role utilities (`text-heading-1`) coexist; do not remove the defaults — a future developer might reach for `text-sm` for a one-off micro-label. Our custom tokens add to the default set.
- **Network panel false-positives.** Browser prefetch might attempt `fonts.googleapis.com` via speculative `<link rel="dns-prefetch">` if any transitive dep adds it. Search `web/node_modules/` for `fonts.googleapis.com` after install; if found, investigate that package's source. (Unlikely with our current deps.)

### Testing standards summary

- **Token contract tests only.** No behavioural tests for font loading — `@fontsource`'s loaders are well-exercised by upstream; we don't need to re-test the library.
- **Manual visual check** is the correctness gate for the `App.tsx` heading render. Browser-automated visual regression would require Playwright, which arrives in Story 1.5+.
- **Test count expected:** ~116 frontend tests (74 from 1.2 + 42 typography contract assertions) + 1 backend = 117 total.

### Project Structure Notes

This story extends the `web/src/design/` subsystem created in Story 1.2. `typography.ts` is a sibling of `theme.ts`. Both are side-effect / pure modules with no React integration per architecture's "design components have no React logic" rule. No conflicts or variances from the architecture detected.

### References

- Architecture — Design Token Source: `!DOCS/planning-artifacts/architecture.md` § Frontend Architecture → Design Token Source
- Architecture — Web directory structure: `!DOCS/planning-artifacts/architecture.md` § Project Structure & Boundaries → `web/src/`
- Architecture — Implementation patterns (no inline typography): `!DOCS/planning-artifacts/architecture.md` § Implementation Patterns & Consistency Rules
- UX — Type scale authoritative values: `!DOCS/planning-artifacts/ux-design-specification.md` § Visual Design Foundation → Typography
- UX — Accessibility typography guidance: `!DOCS/planning-artifacts/ux-design-specification.md` § Accessibility Considerations
- PRD — NFR-S2 (no outbound traffic), NFR-V1 (tokenized), NFR-V3 (consumer-SaaS quality), NFR-A2 (contrast), NFR-A5 (a11y automation), NFR-Q4 (AGENTS.md), NFR-Q6 (commit): `!DOCS/planning-artifacts/prd.md` § Non-Functional Requirements
- Epics — Story 1.3 definition: `!DOCS/planning-artifacts/epics.md` § Epic 1 → Story 1.3
- Story 1.2 completion report (for carry-over context): `!DOCS/implementation-artifacts/1-2-implement-design-tokens.md`
- Tailwind v4 font-size with paired line-height: <https://tailwindcss.com/docs/font-size>
- `@fontsource` project: <https://fontsource.org/>

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via Claude Code (BMad `bmad-dev-story` workflow).

### Debug Log References

- **Biome CSS formatter flipped font-family single quotes to double.** The source authored `'Inter'` / `'JetBrains Mono'`; Biome normalised to `"Inter"` / `"JetBrains Mono"`. Updated the contract-test regexes to accept either quote style (`['"]Inter['"]`) so we don't fight the formatter.
- **Zero other lint / typecheck surprises.** Tailwind v4's `--text-<role>--line-height` + `--letter-spacing` double-dash sub-properties parsed cleanly under the `tailwindDirectives: true` Biome option added in Story 1.2.
- **Dev-server bundle inspection confirmed:**
  - `text-heading-1` utility compiled to `font-size: var(--font-size-heading-1); line-height: var(--tw-leading, var(--line-height-heading-1)); letter-spacing: var(--tw-tracking, var(--letter-spacing-heading-1));` — all three paired props applied from a single class.
  - `font-semibold` resolves `font-weight: var(--font-weight-semibold)` (matches Tailwind default chain onto our token).
  - `@font-face` declarations are served from `/node_modules/@fontsource/inter/files/*.woff2` — no external CDN requests. NFR-S2 satisfied by construction.

### Completion Notes List

- **Scope held.** No motion tokens, no shadcn, no routing, no AppShell — all deferred to their designated stories.
- **NFR-S2 verified.** `@fontsource` packages ship local `.woff2` / `.woff` files under `node_modules/@fontsource/{inter,jetbrains-mono}/files/`; Vite serves them as relative asset URLs; zero outbound font requests.
- **NFR-V1 extended.** `body { font-family: var(--font-family-sans) }` replaces the previous system-font-only rule; every visible text element now resolves through a token chain.
- **NFR-A2 unchanged.** Type sizes and contrast ratios from Story 1.2 remain intact; typography tokens here are scale-only.
- **NFR-Q4 unchanged.** `AGENTS.md` already references `web/src/design/` from Story 1.2; no edit needed (the new `typography.ts` is a sibling of the already-documented `theme.ts`).
- **Test count 75 → 94** (1 backend + 93 frontend): +1 `text-heading-1` (Tailwind utility test implicit via Task 8 visual check), +2 family, +4 weight, +12 role × 1 test-each, +1 family-identity (Inter), +1 family-identity (JetBrains Mono). Actual delta counted by Vitest = 19 new assertions.
- **App.tsx demo applied.** "Hello LatestNews" now renders as `text-heading-1 font-semibold` inside a Tailwind-utility `main` wrapper, matching the Story 1.2 review's "no layout-via-global-CSS" guidance.

### File List

**New — web design subsystem**

- `web/src/design/typography.ts`

**Modified — web**

- `web/package.json` (added `@fontsource/inter`, `@fontsource/jetbrains-mono`)
- `web/package-lock.json`
- `web/src/main.tsx` (side-effect `./design/typography` import above `./index.css`)
- `web/src/App.tsx` (h1 → `text-heading-1 font-semibold`; wrapping main uses Tailwind layout utilities)
- `web/src/index.css` (new typography block inside `@theme inline`; `body` font-family)
- `web/src/design/tokens.css` (typography tokens added under `:root`)
- `web/src/design/__tests__/tokens.test.ts` (typography contract tests: family / weight / per-role × 3 props / Inter-vs-JetBrains regex)

**Modified — planning artefacts**

- `!DOCS/implementation-artifacts/1-3-implement-typography-system.md` (status, task checkboxes, Dev Agent Record)
- `!DOCS/implementation-artifacts/sprint-status.yaml` (1-3 → in-progress → review)

### Change Log

| Date       | Change                                                                                                    |
|------------|-----------------------------------------------------------------------------------------------------------|
| 2026-04-18 | Status → `in-progress`. Installed `@fontsource/inter` + `@fontsource/jetbrains-mono`.                      |
| 2026-04-18 | Tasks 1–10 implemented; 93 web + 1 backend tests green; status → `review` on commit.                      |

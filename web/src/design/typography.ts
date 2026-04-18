/**
 * Self-hosted fonts — NFR-S2 (no outbound traffic).
 *
 * Side-effect-only module. Importing it from `main.tsx` causes the bundler to
 * resolve `@fontsource`'s prebuilt `@font-face` CSS files into the bundle;
 * the referenced `.woff2` binaries ship under `/node_modules/@fontsource/…/
 * files/` and are served locally by Vite. No runtime exports — if a future
 * story needs an enumerated list of loaded weights, add a sibling
 * `typography-manifest.ts` rather than coupling it to this module.
 *
 * Weights selected per UX Design Spec § Visual Foundation → Typography:
 *   - Inter           : 400 (regular body), 500 (labels / UI),
 *                       600 (headings / active UI), 700 (display).
 *   - JetBrains Mono  : 400 (regular) — single weight covers `mono` and
 *                       `mono-sm` roles.
 */

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'

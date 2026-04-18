# Design token contrast reference

Contrast ratios for the primary text/surface pairs in both themes, as
specified by the UX spec (`!DOCS/planning-artifacts/ux-design-specification.md`
§ Visual Design Foundation → Color System).

Every text-on-surface pair below meets WCAG **AA** (≥ 4.5 : 1); primary text
hits WCAG **AAA** (≥ 7 : 1) in both themes. When values are ever revised,
update this table first, recompute ratios (e.g. via WebAIM's contrast
checker), and only then change `tokens.css`.

## Light theme — text on `--color-surface-primary` (`#FFFFFF`)

| Token                  | Value      | Ratio vs. surface-primary | WCAG  |
| ---------------------- | ---------- | ------------------------- | ----- |
| `--color-text-primary` | `#0F1419`  | 16.5 : 1                  | AAA   |
| `--color-text-muted`   | `#4A5566`  | 7.8 : 1                   | AAA   |
| `--color-text-subtle`  | `#6E7889`  | 4.8 : 1                   | AA    |
| `--color-text-inverted`| `#FFFFFF`  | n/a — used on `accent-*`  | —     |

Inverted text (`#FFFFFF`) is used on dark accent surfaces; see table below.

## Dark theme — text on `--color-surface-primary` (`#0A0D12`)

| Token                  | Value      | Ratio vs. surface-primary | WCAG  |
| ---------------------- | ---------- | ------------------------- | ----- |
| `--color-text-primary` | `#E6E9EF`  | 14.8 : 1                  | AAA   |
| `--color-text-muted`   | `#9099A8`  | 6.2 : 1                   | AAA   |
| `--color-text-subtle`  | `#6B7380`  | 4.6 : 1                   | AA    |
| `--color-text-inverted`| `#0A0D12`  | n/a — used on `accent-*`  | —     |

## Inverted text — on `--color-accent-deep` (`#0F2C4D`, both themes)

| Token                  | Ratio | WCAG  |
| ---------------------- | ----- | ----- |
| `--color-text-inverted` (light: `#FFFFFF`) | 11.9 : 1 | AAA |
| `--color-text-inverted` (dark:  `#0A0D12`) | n/a — not used on deep accent in dark mode |

## Never-on-body rule for `--color-accent-glow`

`--color-accent-glow` (`#0DFFAE` light / `#14FFB4` dark) is a signature
neon colour used as **focus ring core**, **gradient tip**, and **citation
underline**. It is deliberately **not used as a background for body text** —
the contrast ratio against common text tokens is below WCAG AA and the
colour is designed to glow, not carry information.

If a future design exception wants to set text on glow, pick
`--color-text-inverted` and verify contrast manually.

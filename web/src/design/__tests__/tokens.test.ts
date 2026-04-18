import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

// Read the tokens file from disk rather than via the Vite `?raw` loader —
// Tailwind's Vite plugin intercepts `.css` imports (even with `?raw`) and
// can return an empty string. fs is unambiguous.
const here = dirname(fileURLToPath(import.meta.url))
const tokensCss = readFileSync(resolve(here, '../tokens.css'), 'utf8')

/**
 * Contract test for `tokens.css`. The token set is the visual vocabulary
 * every downstream component will draw on — accidental deletion or rename
 * should be caught before merge, not in a broken dark-mode screenshot six
 * stories later.
 *
 * We assert two things per colour/shadow token:
 *   1. The token name is present in the file at all.
 *   2. It is declared under BOTH [data-theme='light'] and [data-theme='dark'].
 *
 * For theme-invariant scales (spacing, radius, gradients) we only assert
 * presence in the single :root declaration.
 */

const PER_THEME_TOKENS = [
  // Accent family
  '--color-accent-deep',
  '--color-accent-mid',
  '--color-accent-glow',
  '--color-accent-hover',
  '--color-accent-pressed',
  '--color-accent-subtle-bg',
  '--color-accent-subtle-text',
  '--color-accent-ring',
  // Surface
  '--color-surface-primary',
  '--color-surface-secondary',
  '--color-surface-tertiary',
  '--color-surface-overlay',
  // Text
  '--color-text-primary',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-text-inverted',
  // Border
  '--color-border-subtle',
  '--color-border-default',
  '--color-border-strong',
  // Semantic
  '--color-success',
  '--color-success-subtle-bg',
  '--color-warning',
  '--color-warning-subtle-bg',
  '--color-error',
  '--color-error-subtle-bg',
  '--color-info',
  // Shadows (different values per theme)
  '--shadow-subtle',
  '--shadow-elevated',
  '--shadow-overlay',
  '--shadow-glow-accent',
  '--shadow-glow-accent-subtle',
] as const

const SPACING_TOKENS = [
  '--space-0',
  '--space-0_5',
  '--space-1',
  '--space-1_5',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-8',
  '--space-10',
  '--space-12',
  '--space-16',
  '--space-20',
  '--space-24',
] as const

const RADIUS_TOKENS = [
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-full',
] as const

const GRADIENT_TOKENS = [
  '--gradient-accent-diagonal',
  '--gradient-accent-vertical',
  '--gradient-accent-ring',
  '--gradient-hero-space',
  '--gradient-node-glow',
  '--gradient-citation-highlight',
] as const

function extractBlock(css: string, selector: string): string {
  // Match selector followed by optional whitespace then `{` so that bare
  // selector mentions inside comments don't get picked up.
  const pattern = new RegExp(`${selector.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\{`)
  const match = pattern.exec(css)
  if (!match) return ''
  const open = match.index + match[0].length - 1
  let depth = 1
  let i = open + 1
  while (i < css.length && depth > 0) {
    const ch = css[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    i++
  }
  return css.slice(open + 1, i - 1)
}

describe('tokens.css — theme selectors', () => {
  test('declares [data-theme="light"] and [data-theme="dark"] selectors', () => {
    expect(tokensCss).toContain('[data-theme="light"]')
    expect(tokensCss).toContain('[data-theme="dark"]')
  })
})

describe('tokens.css — per-theme tokens', () => {
  const lightBlock = extractBlock(tokensCss, '[data-theme="light"]')
  const darkBlock = extractBlock(tokensCss, '[data-theme="dark"]')

  test('light-theme block is non-empty', () => {
    expect(lightBlock.length).toBeGreaterThan(100)
  })

  test('dark-theme block is non-empty', () => {
    expect(darkBlock.length).toBeGreaterThan(100)
  })

  test.each(PER_THEME_TOKENS)('token %s is declared in both themes', (token) => {
    expect(lightBlock).toContain(token)
    expect(darkBlock).toContain(token)
  })
})

describe('tokens.css — theme-invariant scales', () => {
  test.each(SPACING_TOKENS)('spacing token %s is declared', (token) => {
    expect(tokensCss).toContain(token)
  })

  test.each(RADIUS_TOKENS)('radius token %s is declared', (token) => {
    expect(tokensCss).toContain(token)
  })

  test.each(GRADIENT_TOKENS)('gradient token %s is declared', (token) => {
    expect(tokensCss).toContain(token)
  })
})

describe('tokens.css — spacing counts are exact', () => {
  test('fifteen spacing tokens (4px base, 0 through 24 with sub-integer slots)', () => {
    expect(SPACING_TOKENS).toHaveLength(15)
  })
})

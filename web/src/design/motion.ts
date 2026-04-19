/**
 * Canonical motion variants for LatestNews.
 *
 * Source of truth for durations (ms), easings, and the seven named variants
 * used across the product. Components spread these into `<motion.*>` elements
 * from the `motion` library (the successor to framer-motion).
 *
 * Design-module rule (architecture § Implementation Patterns): no React
 * logic here, pure TS. Components reach for these; we never import from
 * components.
 *
 * Reduced-motion: prefer Motion's native `useReducedMotion()` hook at
 * React call sites. The exported `respectsReducedMotion()` helper is for
 * non-React contexts (e.g. Sonner's toastOptions) where a hook isn't
 * available.
 */

// ---------------------------------------------------------------------------
// Duration scale (ms)
// ---------------------------------------------------------------------------

export const DURATION_FAST = 120
export const DURATION_BASE = 220
export const DURATION_SOFT = 360

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

// cubic-bezier tuple form — consumed by Motion's `ease` field.
export const EASING_STANDARD = [0.2, 0, 0, 1] as const

// Spring preset — used for physical actions (button press, pulse).
export const EASING_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
} as const

// ---------------------------------------------------------------------------
// Canonical variants
//
// Each export is a plain object ready to spread into a <motion.*> element.
// Values follow the UX spec § Visual Design Foundation → Motion & Timing.
// ---------------------------------------------------------------------------

/** Items, modals, list entries appearing. */
export const enter = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION_BASE / 1000, ease: EASING_STANDARD },
} as const

/** Dismissals, toasts, departing content. */
export const exit = {
  animate: { opacity: 0, y: -4 },
  transition: { duration: DURATION_FAST / 1000, ease: EASING_STANDARD },
} as const

/** Soft landing: graph nodes settling, first mount of a card. */
export const settle = {
  initial: { scale: 0.98, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: EASING_SPRING,
} as const

/** Attention-draw for hover states. Spring physics own the timing — Motion
    ignores `duration` when `type === 'spring'`, so we don't set it. */
export const pulse = {
  animate: { scale: [1, 1.03, 1] },
  transition: EASING_SPRING,
} as const

/** Tactile button feedback — tap / click. */
export const press = {
  whileTap: { scale: 0.96 },
  transition: EASING_SPRING,
} as const

/** Staggered `enter` for list items (30ms between siblings). */
export const stagger = {
  animate: { transition: { staggerChildren: 0.03 } },
} as const

/** Ambient neon pulse for live affordances (send button idle in chat). */
export const glowBreathe = {
  animate: {
    boxShadow: ['var(--shadow-subtle)', 'var(--shadow-glow-accent)', 'var(--shadow-subtle)'],
  },
  transition: {
    duration: 2,
    ease: EASING_STANDARD,
    repeat: Number.POSITIVE_INFINITY,
  },
} as const

// ---------------------------------------------------------------------------
// Reduced-motion helper
// ---------------------------------------------------------------------------

type AnyRecord = Record<string, unknown>

function applyReducedFallback<T>(variant: T): T {
  if (variant === null || typeof variant !== 'object') return variant
  const clone = structuredClone(variant) as AnyRecord
  if (clone.transition && typeof clone.transition === 'object') {
    const t = clone.transition as AnyRecord
    t.duration = 0.001
    t.repeat = 0
    // Drop spring physics — no-op when already a cubic-bezier.
    if (t.type === 'spring') delete t.type
  }
  return clone as T
}

/**
 * Returns a reduced-motion-safe copy of the variant when the browser reports
 * `prefers-reduced-motion: reduce`. On the server / no-window, returns the
 * input unchanged.
 *
 * Prefer Motion's `useReducedMotion()` hook at React call sites; this helper
 * exists for non-hook contexts (Sonner's toastOptions, third-party configs).
 */
export function respectsReducedMotion<T>(variant: T): T {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return variant
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduced ? applyReducedFallback(variant) : variant
}

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  DURATION_BASE,
  DURATION_FAST,
  DURATION_SOFT,
  EASING_SPRING,
  EASING_STANDARD,
  enter,
  exit,
  glowBreathe,
  press,
  pulse,
  respectsReducedMotion,
  settle,
  stagger,
} from '../motion'

describe('motion constants', () => {
  test('duration scale is 120 / 220 / 360 ms', () => {
    expect(DURATION_FAST).toBe(120)
    expect(DURATION_BASE).toBe(220)
    expect(DURATION_SOFT).toBe(360)
  })

  test('EASING_STANDARD is the cubic-bezier tuple from the UX spec', () => {
    expect(EASING_STANDARD).toEqual([0.2, 0, 0, 1])
  })

  test('EASING_SPRING has the documented spring preset', () => {
    expect(EASING_SPRING).toEqual({ type: 'spring', stiffness: 300, damping: 30 })
  })
})

describe('motion variants — shape', () => {
  test('enter animates opacity + y with base duration', () => {
    expect(enter.initial).toEqual({ opacity: 0, y: 4 })
    expect(enter.animate).toEqual({ opacity: 1, y: 0 })
    expect(enter.transition.duration).toBeCloseTo(0.22)
  })

  test('exit fades out with fast duration', () => {
    expect(exit.animate).toEqual({ opacity: 0, y: -4 })
    expect(exit.transition.duration).toBeCloseTo(0.12)
  })

  test('settle uses the spring preset', () => {
    expect(settle.initial).toEqual({ scale: 0.98, opacity: 0 })
    expect(settle.transition.type).toBe('spring')
  })

  test('pulse scales 1 → 1.03 → 1 with spring physics owning the timing', () => {
    expect(pulse.animate.scale).toEqual([1, 1.03, 1])
    expect(pulse.transition.type).toBe('spring')
    // Motion ignores `duration` when type === 'spring'; we deliberately omit it.
    expect('duration' in pulse.transition).toBe(false)
  })

  test('press applies whileTap scale 0.96', () => {
    expect(press.whileTap).toEqual({ scale: 0.96 })
  })

  test('stagger has 30ms staggerChildren', () => {
    expect(stagger.animate.transition.staggerChildren).toBeCloseTo(0.03)
  })

  test('glowBreathe loops the accent halo', () => {
    expect(glowBreathe.animate.boxShadow).toHaveLength(3)
    expect(glowBreathe.transition.repeat).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('respectsReducedMotion', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('returns the input unchanged when reduced-motion is false', () => {
    const v = respectsReducedMotion(enter)
    expect(v.transition.duration).toBeCloseTo(0.22)
    expect(v.animate).toEqual({ opacity: 1, y: 0 })
  })

  test('collapses duration to ~1ms and strips spring when reduced-motion is true', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const v = respectsReducedMotion({
      transition: { duration: 0.22, type: 'spring', repeat: Infinity },
    })
    expect(v.transition.duration).toBeCloseTo(0.001)
    expect(v.transition.repeat).toBe(0)
    expect(v.transition.type).toBeUndefined()
  })

  test('leaves primitives alone (non-object variants)', () => {
    expect(respectsReducedMotion(42)).toBe(42)
    expect(respectsReducedMotion('x')).toBe('x')
  })
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { __resetThemeListenerForTests, applyInitialTheme, getTheme, setTheme } from '../theme'

type MediaQueryMock = {
  matches: boolean
  media: string
  onchange: null
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
  _handlers: Array<(event: { matches: boolean }) => void>
}

function makeMatchMediaMock(initialMatches: boolean): MediaQueryMock {
  const handlers: Array<(event: { matches: boolean }) => void> = []
  const mock: MediaQueryMock = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
      if (event === 'change') handlers.push(handler)
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _handlers: handlers,
  }
  return mock
}

function makeLocalStorageMock(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  } as Storage
}

let currentMql: MediaQueryMock

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: makeLocalStorageMock(),
    writable: true,
    configurable: true,
  })
  document.documentElement.removeAttribute('data-theme')
  currentMql = makeMatchMediaMock(false)
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn(() => currentMql),
    writable: true,
    configurable: true,
  })
  __resetThemeListenerForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applyInitialTheme', () => {
  test('respects explicit "light" stored in localStorage even if OS prefers dark', () => {
    localStorage.setItem('latestnews:theme', 'light')
    currentMql.matches = true // OS dark

    applyInitialTheme()

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('respects explicit "dark" stored in localStorage', () => {
    localStorage.setItem('latestnews:theme', 'dark')

    applyInitialTheme()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  test('falls back to prefers-color-scheme when no override stored (light)', () => {
    currentMql.matches = false

    applyInitialTheme()

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('falls back to prefers-color-scheme when no override stored (dark)', () => {
    currentMql.matches = true

    applyInitialTheme()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  test('treats corrupt localStorage value as system (no throw)', () => {
    localStorage.setItem('latestnews:theme', 'garbage-mode')
    currentMql.matches = true

    expect(() => applyInitialTheme()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('setTheme', () => {
  test('"dark" persists to localStorage and applies data-theme', () => {
    applyInitialTheme()

    setTheme('dark')

    expect(localStorage.getItem('latestnews:theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  test('"light" persists and applies', () => {
    applyInitialTheme()

    setTheme('light')

    expect(localStorage.getItem('latestnews:theme')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  test('"system" clears localStorage override and re-reads prefers-color-scheme', () => {
    localStorage.setItem('latestnews:theme', 'dark')
    applyInitialTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')

    currentMql.matches = false // OS now light
    setTheme('system')

    expect(localStorage.getItem('latestnews:theme')).toBeNull()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('getTheme', () => {
  test('returns "system" when no override is set', () => {
    expect(getTheme()).toBe('system')
  })

  test('returns the stored explicit mode', () => {
    localStorage.setItem('latestnews:theme', 'dark')
    expect(getTheme()).toBe('dark')
  })

  test('returns "system" for corrupt stored value', () => {
    localStorage.setItem('latestnews:theme', 'whatever')
    expect(getTheme()).toBe('system')
  })
})

describe('OS-theme media-query listener', () => {
  test('updates data-theme when mode is "system" and OS flips', () => {
    // mode = system (nothing stored). Start in light.
    currentMql.matches = false
    applyInitialTheme()
    expect(document.documentElement.dataset.theme).toBe('light')

    // Simulate OS flipping to dark.
    const handler = currentMql._handlers[0]
    expect(handler).toBeDefined()
    handler({ matches: true })

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  test('does NOT override explicit user choice when OS changes', () => {
    // User has explicitly chosen light.
    localStorage.setItem('latestnews:theme', 'light')
    applyInitialTheme()
    expect(document.documentElement.dataset.theme).toBe('light')

    // OS flips to dark — user choice must win.
    const handler = currentMql._handlers[0]
    expect(handler).toBeDefined()
    handler({ matches: true })

    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

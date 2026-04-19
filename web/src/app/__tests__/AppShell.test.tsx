import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, type RouteObject, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DashboardRoute } from '@/routes/dashboard'
import { ExploreRoute } from '@/routes/explore'
import { SettingsRoute } from '@/routes/settings'
import { AppShell } from '../AppShell'

// ---------------------------------------------------------------------------
// Harness — matches the real router from src/router.tsx but uses memory mode
// so tests don't touch window.location.
// ---------------------------------------------------------------------------

const TEST_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'explore', element: <ExploreRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
]

function renderAt(path: string) {
  const router = createMemoryRouter(TEST_ROUTES, { initialEntries: [path] })
  const utils = render(<RouterProvider router={router} />)
  return { ...utils, router }
}

// ---------------------------------------------------------------------------
// Per-test environment reset — same pattern as theme.test.ts.
// ---------------------------------------------------------------------------

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

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: makeLocalStorageMock(),
    writable: true,
    configurable: true,
  })
  // Force Mac detection so metaKey shortcuts register under happy-dom. Our
  // shortcut handler checks navigator.platform; the test environment defaults
  // to a non-Mac value and the Cmd-1/2/3 path becomes dead.
  Object.defineProperty(navigator, 'platform', {
    value: 'MacIntel',
    writable: true,
    configurable: true,
  })
  document.documentElement.removeAttribute('data-theme')
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AppShell — top chrome', () => {
  test('wordmark + route indicator render on /', () => {
    renderAt('/')
    expect(screen.getByText('LatestNews')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
  })

  test('route indicator matches initial route on /explore', () => {
    renderAt('/explore')
    // The explore h1 + the route indicator both say 'Explore'.
    expect(screen.getAllByText('Explore').length).toBeGreaterThanOrEqual(1)
  })
})

describe('AppShell — keyboard navigation', () => {
  test('Cmd-2 navigates to /explore', () => {
    const { router } = renderAt('/')
    act(() => {
      fireEvent.keyDown(document, { key: '2', metaKey: true })
    })
    expect(router.state.location.pathname).toBe('/explore')
  })

  test('Cmd-3 navigates to /settings', () => {
    const { router } = renderAt('/')
    act(() => {
      fireEvent.keyDown(document, { key: '3', metaKey: true })
    })
    expect(router.state.location.pathname).toBe('/settings')
  })

  test('Cmd-1 returns to /', () => {
    const { router } = renderAt('/settings')
    act(() => {
      fireEvent.keyDown(document, { key: '1', metaKey: true })
    })
    expect(router.state.location.pathname).toBe('/')
  })
})

describe('AppShell — help overlay', () => {
  test('? opens the help overlay', () => {
    renderAt('/')
    act(() => {
      fireEvent.keyDown(document, { key: '?' })
    })
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument()
  })

  test('? pressed while an input is focused does NOT open the overlay', () => {
    const { container } = renderAt('/')
    const input = document.createElement('input')
    container.appendChild(input)
    input.focus()
    act(() => {
      fireEvent.keyDown(input, { key: '?' })
    })
    expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument()
  })
})

describe('AppShell — theme toggle', () => {
  test('clicking the toggle cycles system → light → dark → system', async () => {
    renderAt('/')
    // Initial: system (no localStorage) → button aria = "Switch to light".
    let btn = screen.getByRole('button', { name: /Switch to/ })
    expect(btn.getAttribute('aria-label')).toBe('Switch to light')

    act(() => {
      fireEvent.click(btn)
    })
    btn = screen.getByRole('button', { name: /Switch to/ })
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark')
    expect(localStorage.getItem('latestnews:theme')).toBe('light')

    act(() => {
      fireEvent.click(btn)
    })
    btn = screen.getByRole('button', { name: /Switch to/ })
    expect(btn.getAttribute('aria-label')).toBe('Switch to system')
    expect(localStorage.getItem('latestnews:theme')).toBe('dark')

    act(() => {
      fireEvent.click(btn)
    })
    btn = screen.getByRole('button', { name: /Switch to/ })
    expect(btn.getAttribute('aria-label')).toBe('Switch to light')
    expect(localStorage.getItem('latestnews:theme')).toBeNull()
  })
})

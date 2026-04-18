/**
 * Theme infrastructure.
 *
 * Applies `data-theme="light" | "dark"` to <html> based on:
 *   1. explicit user choice persisted in localStorage (highest priority), or
 *   2. the OS-level `prefers-color-scheme` media query (default).
 *
 * `applyInitialTheme()` is called from `main.tsx` BEFORE React mounts, so
 * the first paint has the correct colours — no FOUC.
 *
 * Design module rule (architecture § Implementation Patterns): no React
 * logic here, only CSS custom properties and pure TS exports.
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'latestnews:theme'
const VALID_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'] as const
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

function isValidMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && VALID_MODES.includes(value as ThemeMode)
}

function hasDom(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined'
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function readStoredMode(): ThemeMode {
  if (!hasStorage()) return 'system'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return 'system'
    if (isValidMode(raw)) return raw
    // biome-ignore lint/suspicious/noConsole: boot-time diagnostic for corrupt storage
    console.warn(`[theme] ignoring invalid stored value "${raw}" — falling back to system`)
    return 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  if (!hasDom()) return false
  return window.matchMedia(DARK_MEDIA_QUERY).matches
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return mode
}

function writeDataTheme(resolved: ResolvedTheme): void {
  if (!hasDom()) return
  document.documentElement.dataset.theme = resolved
}

/**
 * Apply the effective theme to <html> synchronously. Safe to call multiple
 * times. Intended to run once before React mounts to avoid FOUC.
 */
export function applyInitialTheme(): void {
  if (!hasDom()) return
  const mode = readStoredMode()
  writeDataTheme(resolve(mode))
  ensureSystemListener()
}

/**
 * Persist the user's theme choice and apply it immediately.
 *
 * `'system'` clears the override and re-reads `prefers-color-scheme`.
 */
export function setTheme(mode: ThemeMode): void {
  if (!hasDom()) return
  if (hasStorage()) {
    try {
      if (mode === 'system') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, mode)
      }
    } catch {
      // Storage might be blocked (private mode, quota) — still apply in-memory.
    }
  }
  writeDataTheme(resolve(mode))
}

/**
 * Returns the persisted mode. `'system'` means no explicit override is set.
 */
export function getTheme(): ThemeMode {
  return readStoredMode()
}

// ---------------------------------------------------------------------------
// OS-theme listener — active only while mode === 'system'.
// ---------------------------------------------------------------------------

let listenerBound = false

function ensureSystemListener(): void {
  if (listenerBound || !hasDom() || typeof window.matchMedia !== 'function') {
    return
  }
  const mql = window.matchMedia(DARK_MEDIA_QUERY)
  mql.addEventListener('change', (event) => {
    if (readStoredMode() !== 'system') return
    writeDataTheme(event.matches ? 'dark' : 'light')
  })
  listenerBound = true
}

// Exported for tests only — resets the module-level listener guard so
// `beforeEach` can re-stub matchMedia and re-bind.
export function __resetThemeListenerForTests(): void {
  listenerBound = false
}

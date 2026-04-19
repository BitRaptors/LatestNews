/**
 * Platform detection helpers. `navigator.platform` is technically deprecated
 * but still present in every target browser and more reliable than the
 * `userAgentData` API for our simple Mac / non-Mac split.
 */

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform.toLowerCase().includes('mac')
}

/**
 * Returns true if the pressed key's meta/ctrl modifier matches the active
 * platform — Cmd on macOS, Ctrl elsewhere.
 */
export function isPlatformShortcut(event: KeyboardEvent): boolean {
  return isMacPlatform() ? event.metaKey : event.ctrlKey
}

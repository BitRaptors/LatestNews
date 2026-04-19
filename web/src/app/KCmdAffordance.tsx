import { isMacPlatform } from './platform'

/**
 * Visual affordance for the Cmd-K palette — non-interactive. Real palette
 * logic lands in Story 4.3. The chip is `tabindex={-1}` so keyboard users
 * aren't forced through a dead-end focus target.
 */
export function KCmdAffordance() {
  const modifierSymbol = isMacPlatform() ? '⌘' : 'Ctrl'
  return (
    <span
      className="text-caption select-none rounded-md border border-border-default bg-surface-tertiary px-2 py-1 text-text-muted"
      aria-hidden
    >
      {modifierSymbol} K
    </span>
  )
}

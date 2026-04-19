import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { isEditableTarget } from '@/lib/dom'
import { isPlatformShortcut } from './platform'

type Options = {
  onShowHelp: () => void
  onOpenPalette: () => void
}

const ROUTE_BY_DIGIT: Record<string, string> = {
  '1': '/',
  '2': '/explore',
  '3': '/settings',
}

/**
 * Binds global keyboard shortcuts at the AppShell level.
 *
 * - Cmd-1 / Cmd-2 / Cmd-3 → navigate to Dashboard / Explore / Settings
 * - Cmd-K → open palette (stub until Story 4.3)
 * - ? → toggle help overlay (only when no editable element has focus)
 *
 * Typing into an input, textarea, or `[contenteditable]` bypasses all
 * shortcuts — users expect the keys to reach the field.
 */
export function useGlobalShortcuts({ onShowHelp, onOpenPalette }: Options): void {
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      const isShortcutModifier = isPlatformShortcut(event)

      if (isShortcutModifier && !event.shiftKey && !event.altKey) {
        const route = ROUTE_BY_DIGIT[event.key]
        if (route !== undefined) {
          event.preventDefault()
          navigate(route)
          return
        }
        if (event.key.toLowerCase() === 'k') {
          event.preventDefault()
          onOpenPalette()
          return
        }
      }

      // Bare `?` — toggle help overlay. Shift+/ on most layouts yields `?`.
      if (event.key === '?' && !isShortcutModifier) {
        event.preventDefault()
        onShowHelp()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate, onShowHelp, onOpenPalette])
}

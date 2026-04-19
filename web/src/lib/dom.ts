/**
 * DOM-level helpers shared across the app layer and feature modules.
 *
 * Lives at the lib/ boundary (pure utilities, no React), so both
 * `app/useGlobalShortcuts.ts` and `features/capture/DropZone.tsx` can consume
 * one definition of "is this event target an editable element?".
 */

/**
 * Returns true when the event target is a text-input, textarea, select, or
 * `[contenteditable]` — any element where a keyboard or drag gesture is
 * expected to reach the field natively and must NOT be hijacked by a
 * global handler.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

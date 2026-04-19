import { useEffect } from 'react'
import { toast } from 'sonner'
import { postCaptureUrl } from '@/features/capture/postCapture'
import { isEditableTarget } from '@/lib/dom'

/**
 * Global clipboard capture.
 *
 * Binds a `paste` listener to `document`. Paste anywhere except inside a
 * text field fires `POST /api/items` with the clipboard's `text/plain`
 * payload. Paste inside an `<input>` / `<textarea>` / `<select>` /
 * `[contenteditable]` falls through to the browser's native paste —
 * `isEditableTarget` is the single source of truth for that check
 * (shared with `DropZone` and `useGlobalShortcuts`).
 *
 * Deliberately a separate hook from `useGlobalShortcuts` — paste is a
 * `ClipboardEvent`, not a `KeyboardEvent`, and the browser handles
 * Cmd/Ctrl-V platform dispatch natively (no modifier inspection needed).
 *
 * Images + non-text clipboard payloads are out of scope (see Story 2.3).
 */
export function useGlobalPasteHandler(): void {
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isEditableTarget(event.target)) return

      const text = event.clipboardData?.getData('text/plain') ?? ''
      const trimmed = text.trim()
      if (trimmed.length === 0) {
        // Empty clipboard or non-text payload (image-only paste, etc.).
        // Let the browser do whatever its default is — usually nothing.
        return
      }

      // We're handling it — stop the browser's native paste on this element.
      event.preventDefault()

      // Fire and forget. Success surfaces via a toast; failures are logged
      // until Story 2.5 ships the retry UI.
      void (async () => {
        try {
          await postCaptureUrl(trimmed)
          toast.success('Captured', { duration: 2000 })
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI
          console.warn('paste capture failed', error)
        }
      })()
    }

    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])
}

import { useEffect, useRef, useState } from 'react'
import { isEditableTarget } from '@/lib/dom'
import { postCaptureFile, postCaptureUrl } from './postCapture'

/**
 * Page-wide drop zone for file + URL captures.
 *
 * Binds drag events to `document.body` so any drop onto the Dashboard route
 * (except onto editable elements — native text-drag stays intact) activates
 * a full-overlay "Drop to capture" affordance. The overlay uses the same
 * `data-[state=open|closed]` pattern established in Story 1.5's overlay
 * retokenization, so reduced-motion users get instant state changes via
 * the global reset in `index.css`.
 *
 * Nested `dragenter`/`dragleave` events fire for every child element; a
 * depth counter prevents overlay flicker during rapid bubble traversal.
 */
export function DropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const depthRef = useRef(0)

  useEffect(() => {
    function onDragEnter(event: DragEvent) {
      if (isEditableTarget(event.target)) return
      // Only react to drags that carry a payload we can handle — files or
      // text/URL strings. Prevents accidental activation for in-page
      // element drags.
      const types = event.dataTransfer?.types ?? []
      const carriesFiles = Array.from(types).some(
        (t) => t === 'Files' || t === 'text/uri-list' || t === 'text/plain',
      )
      if (!carriesFiles) return

      event.preventDefault()
      depthRef.current += 1
      setIsDragging(true)
    }

    function onDragOver(event: DragEvent) {
      if (isEditableTarget(event.target)) return
      // preventDefault is mandatory: without it, the browser refuses to
      // fire a `drop` event.
      event.preventDefault()
    }

    function onDragLeave(event: DragEvent) {
      if (isEditableTarget(event.target)) return
      depthRef.current = Math.max(0, depthRef.current - 1)
      if (depthRef.current === 0) setIsDragging(false)
    }

    async function onDrop(event: DragEvent) {
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      depthRef.current = 0
      setIsDragging(false)

      const dt = event.dataTransfer
      if (!dt) return

      const files = Array.from(dt.files ?? [])
      if (files.length > 0) {
        for (const file of files) {
          try {
            await postCaptureFile(file)
          } catch (error) {
            // biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI
            console.warn('capture file failed', error)
          }
        }
        return
      }

      const uri = dt.getData('text/uri-list') || dt.getData('text/plain')
      if (uri.trim().length > 0) {
        try {
          await postCaptureUrl(uri.trim())
        } catch (error) {
          // biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI
          console.warn('capture url failed', error)
        }
      }
    }

    document.body.addEventListener('dragenter', onDragEnter)
    document.body.addEventListener('dragover', onDragOver)
    document.body.addEventListener('dragleave', onDragLeave)
    document.body.addEventListener('drop', onDrop)

    return () => {
      document.body.removeEventListener('dragenter', onDragEnter)
      document.body.removeEventListener('dragover', onDragOver)
      document.body.removeEventListener('dragleave', onDragLeave)
      document.body.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <div
      data-state={isDragging ? 'open' : 'closed'}
      aria-hidden={!isDragging}
      className={
        // Fixed full-viewport overlay. z-40 sits below a focused Dialog
        // (Radix default z-50) so the HelpOverlay still dismisses drags.
        'pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-surface-overlay supports-backdrop-filter:backdrop-blur-sm ' +
        'transition-opacity duration-base ease-standard ' +
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0'
      }
    >
      <div className="rounded-lg border-2 border-dashed border-accent-ring bg-surface-primary/80 p-12 text-center shadow-overlay">
        <p className="text-heading-2 font-semibold text-accent-deep">Drop to capture</p>
        <p className="mt-2 text-body text-text-muted">URLs, PDFs, images, markdown, plain text</p>
      </div>
    </div>
  )
}

import { LoaderCircle, SendHorizontal } from 'lucide-react'
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { isMacPlatform } from '@/app/platform'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { postCaptureUrl } from './postCapture'
import { CaptureUrlSchema } from './types'

/**
 * Dashboard capture input. Paste / type → Enter (or Cmd/Ctrl+Enter) to
 * submit. Escape clears and blurs. The atmospheric halo sitting behind the
 * input is Direction B's signature surface — pointer-events-none so it
 * never interferes with clicks.
 *
 * Submission is fire-and-forget: input disables, a spinner swaps in, on
 * success the value clears and re-focuses, on failure the value persists
 * until the user retries (NFR-R1 — no silent data loss). Error surfacing
 * via Sonner toast + retry affordance lands in Story 2.5.
 */
export function CaptureInput() {
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const placeholder = `Paste a link, drop a file, or ${isMacPlatform() ? '⌘V' : 'Ctrl+V'} from anywhere`

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (isSubmitting) return
    const parsed = CaptureUrlSchema.safeParse({ url: value })
    if (!parsed.success) return

    setIsSubmitting(true)
    try {
      await postCaptureUrl(parsed.data.url)
      setValue('')
      inputRef.current?.focus()
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: Story 2.5 replaces this with a toast + retry UI
      console.warn('capture failed', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setValue('')
      inputRef.current?.blur()
      return
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={submit} className="relative" aria-label="Capture form">
      {/* Atmospheric halo — purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -top-10 bottom-0 -z-10 rounded-full bg-[image:var(--gradient-accent-vertical)] opacity-40 blur-2xl"
      />
      <div
        className={cn(
          'relative flex items-center gap-2 rounded-md border border-border-default bg-surface-primary px-3 py-2 shadow-subtle',
          'focus-within:shadow-glow-accent',
          'transition-shadow duration-base ease-standard',
          isSubmitting && 'cursor-progress',
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          aria-label="Capture URL or text"
          className={cn(
            'flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted outline-none',
            'disabled:cursor-progress disabled:opacity-60',
          )}
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          aria-label="Submit capture"
          className="size-8 shrink-0 p-0"
          disabled={isSubmitting || value.trim().length === 0}
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizontal className="size-4" aria-hidden />
          )}
        </Button>
      </div>
    </form>
  )
}

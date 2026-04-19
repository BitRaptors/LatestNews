import { z } from 'zod'

/**
 * Minimal client-side validation. Backend (Story 2.2) is authoritative — we
 * only block empty / whitespace-only submissions here. Any non-empty string
 * goes through: URL, free text, file path, whatever the user typed.
 */
export const CaptureUrlSchema = z.object({
  url: z.string().trim().min(1, 'Enter a URL or text to capture'),
})

export type CaptureUrlPayload = z.infer<typeof CaptureUrlSchema>

/**
 * Source-type discriminator attached to multipart file uploads. The backend
 * uses this as a hint when routing to the right ingest plugin (Story 2.2+).
 * Unknown MIME types fall back to `text` — backend decides whether to accept.
 */
export type SourceType = 'pdf' | 'image' | 'markdown' | 'text'

export function inferSourceType(mime: string): SourceType {
  const normalized = mime.toLowerCase()
  if (normalized === 'application/pdf') return 'pdf'
  if (normalized.startsWith('image/')) return 'image'
  if (normalized === 'text/markdown' || normalized === 'text/x-markdown') {
    return 'markdown'
  }
  return 'text'
}

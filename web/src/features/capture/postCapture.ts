/**
 * Fire-and-forget POST helpers for the capture flow.
 *
 * Both hit `/api/items` — the backend endpoint that Story 2.2 implements.
 * In Story 2.1 the backend is not yet available; requests will 502 through
 * the Vite dev proxy. Tests mock `fetch`.
 *
 * Deliberately plain functions, not TanStack Query mutations or hooks — the
 * caller owns submitting state. When a later story introduces cross-component
 * cache coordination (item list invalidation on success), we'll migrate here.
 */

import { inferSourceType, type SourceType } from './types'

const ENDPOINT = '/api/items'

export type CaptureResponse = {
  id: string
  status: 'queued'
}

class CaptureError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'CaptureError'
    this.status = status
  }
}

async function parseOrThrow(response: Response): Promise<CaptureResponse> {
  if (!response.ok) {
    throw new CaptureError(`capture failed: HTTP ${response.status}`, response.status)
  }
  return (await response.json()) as CaptureResponse
}

/**
 * POST a URL or free-text string as JSON.
 *
 * Backend body: `{ url: string }` per architecture § API → Capture.
 */
export async function postCaptureUrl(url: string): Promise<CaptureResponse> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return parseOrThrow(response)
}

/**
 * POST a single file via multipart/form-data.
 *
 * Do NOT set `Content-Type` manually — the browser builds the multipart
 * boundary automatically. `source_type` is inferred from the MIME and sent
 * as a form field the backend plugin dispatcher can route on.
 */
export async function postCaptureFile(file: File): Promise<CaptureResponse> {
  const body = new FormData()
  body.append('file', file)
  const sourceType: SourceType = inferSourceType(file.type)
  body.append('source_type', sourceType)

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    body,
  })
  return parseOrThrow(response)
}

export { CaptureError }

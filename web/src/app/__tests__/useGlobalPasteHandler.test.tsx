import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// Mock sonner BEFORE importing the hook so the factory's `toast.success`
// spy is the instance the hook closes over.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

import { toast } from 'sonner'
import { useGlobalPasteHandler } from '../useGlobalPasteHandler'

// ---------------------------------------------------------------------------
// Test host — the only way to exercise a React hook's useEffect wiring.
// ---------------------------------------------------------------------------

function TestHost() {
  useGlobalPasteHandler()
  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubFetchOk() {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ id: 'abc', status: 'queued' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

function stubFetchError() {
  const fn = vi.fn().mockResolvedValue(new Response('boom', { status: 500 }))
  vi.stubGlobal('fetch', fn)
  return fn
}

function makePasteEvent(target: EventTarget, textPlain: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'target', { value: target, configurable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => (type === 'text/plain' ? textPlain : ''),
    },
    configurable: true,
  })
  return event
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.mocked(toast.success).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGlobalPasteHandler', () => {
  test('paste on document.body with text POSTs JSON to /api/items', async () => {
    const fetchMock = stubFetchOk()
    render(<TestHost />)

    await act(async () => {
      const event = makePasteEvent(document.body, 'https://example.com/a')
      document.dispatchEvent(event)
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/items')
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ url: 'https://example.com/a' }))
  })

  test('paste inside <input> does NOT fire fetch and does NOT preventDefault', async () => {
    const fetchMock = stubFetchOk()
    const input = document.createElement('input')
    document.body.appendChild(input)
    render(<TestHost />)

    const event = makePasteEvent(input, 'hello')
    act(() => {
      document.dispatchEvent(event)
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    document.body.removeChild(input)
  })

  test('paste on contenteditable div is NOT hijacked', async () => {
    const fetchMock = stubFetchOk()
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    document.body.appendChild(editable)
    render(<TestHost />)

    const event = makePasteEvent(editable, 'text')
    act(() => {
      document.dispatchEvent(event)
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    document.body.removeChild(editable)
  })

  test('paste with empty clipboard is a silent no-op', async () => {
    const fetchMock = stubFetchOk()
    render(<TestHost />)

    act(() => {
      document.dispatchEvent(makePasteEvent(document.body, ''))
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('paste with whitespace-only clipboard is a silent no-op', async () => {
    const fetchMock = stubFetchOk()
    render(<TestHost />)

    act(() => {
      document.dispatchEvent(makePasteEvent(document.body, '   \n\t  '))
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  test('successful paste fires toast.success with 2000ms duration', async () => {
    stubFetchOk()
    render(<TestHost />)

    await act(async () => {
      document.dispatchEvent(makePasteEvent(document.body, 'https://example.com'))
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith('Captured', { duration: 2000 })
  })

  test('failed paste logs console.warn and does NOT fire toast.success', async () => {
    stubFetchError()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<TestHost />)

    await act(async () => {
      document.dispatchEvent(makePasteEvent(document.body, 'https://example.com'))
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(warnSpy).toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})

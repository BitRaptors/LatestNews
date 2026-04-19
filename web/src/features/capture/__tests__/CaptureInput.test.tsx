import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CaptureInput } from '../CaptureInput'

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
  const fn = vi.fn().mockResolvedValue(
    new Response('backend exploded', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  // Mac detection so the placeholder reads ⌘V — keeps assertions stable.
  Object.defineProperty(navigator, 'platform', {
    value: 'MacIntel',
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CaptureInput', () => {
  test('renders with the ⌘V placeholder and is auto-focused', () => {
    render(<CaptureInput />)
    const input = screen.getByRole('textbox', { name: /Capture URL or text/ })
    expect(input).toHaveAttribute('placeholder', expect.stringContaining('⌘V'))
    expect(input).toHaveFocus()
  })

  test('Enter with a value POSTs JSON to /api/items', async () => {
    const fetchMock = stubFetchOk()
    const user = userEvent.setup()
    render(<CaptureInput />)
    await user.type(screen.getByRole('textbox'), 'https://example.com{Enter}')

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/items')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ url: 'https://example.com' }))
  })

  test('empty Enter does not fetch (client-side validation blocks)', async () => {
    const fetchMock = stubFetchOk()
    render(<CaptureInput />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('Escape clears the value', async () => {
    const user = userEvent.setup()
    render(<CaptureInput />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    await user.type(input, 'abc')
    expect(input.value).toBe('abc')
    await user.keyboard('{Escape}')
    expect(input.value).toBe('')
  })

  test('successful fetch clears the input', async () => {
    stubFetchOk()
    const user = userEvent.setup()
    render(<CaptureInput />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    await user.type(input, 'hello{Enter}')
    await waitFor(() => expect(input.value).toBe(''))
  })

  test('failed fetch leaves the input populated', async () => {
    stubFetchError()
    const user = userEvent.setup()
    render(<CaptureInput />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    await user.type(input, 'hello{Enter}')
    // After the submit settles (isSubmitting back to false), the value must
    // still be there — NFR-R1: no silent data loss.
    await waitFor(() => expect(input).not.toBeDisabled())
    expect(input.value).toBe('hello')
  })
})

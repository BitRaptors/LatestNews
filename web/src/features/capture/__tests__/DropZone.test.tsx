import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { DropZone } from '../DropZone'

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

function makeDragEvent(
  type: string,
  target: EventTarget,
  opts: {
    files?: File[]
    types?: string[]
    getData?: (k: string) => string
  } = {},
): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'target', { value: target, configurable: true })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files: opts.files ?? [],
      types: opts.types ?? [],
      getData: opts.getData ?? (() => ''),
    },
    configurable: true,
  })
  return event as DragEvent
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DropZone', () => {
  test('dragenter with Files activates the overlay; dragleave deactivates it', () => {
    const { container } = render(<DropZone />)
    const overlay = container.querySelector('[data-state]') as HTMLElement
    expect(overlay.dataset.state).toBe('closed')

    act(() => {
      document.body.dispatchEvent(makeDragEvent('dragenter', document.body, { types: ['Files'] }))
    })
    expect(overlay.dataset.state).toBe('open')

    act(() => {
      document.body.dispatchEvent(makeDragEvent('dragleave', document.body, { types: ['Files'] }))
    })
    expect(overlay.dataset.state).toBe('closed')
  })

  test('drop with a file POSTs multipart to /api/items', async () => {
    const fetchMock = stubFetchOk()
    render(<DropZone />)

    const file = new File(['pdf body'], 'test.pdf', { type: 'application/pdf' })

    await act(async () => {
      document.body.dispatchEvent(makeDragEvent('dragenter', document.body, { types: ['Files'] }))
      document.body.dispatchEvent(
        makeDragEvent('drop', document.body, {
          files: [file],
          types: ['Files'],
        }),
      )
      // Let the async drop handler's awaited postCaptureFile flush.
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/items')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    const body = init.body as FormData
    expect(body.get('file')).toBeInstanceOf(File)
    expect(body.get('source_type')).toBe('pdf')
  })

  test('drop with a URL-only payload POSTs JSON to /api/items', async () => {
    const fetchMock = stubFetchOk()
    render(<DropZone />)

    await act(async () => {
      document.body.dispatchEvent(
        makeDragEvent('dragenter', document.body, {
          types: ['text/uri-list'],
        }),
      )
      document.body.dispatchEvent(
        makeDragEvent('drop', document.body, {
          files: [],
          types: ['text/uri-list'],
          getData: (k) => (k === 'text/uri-list' ? 'https://example.com/foo' : ''),
        }),
      )
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ url: 'https://example.com/foo' }))
  })

  test('dragenter → drop closes the overlay again', async () => {
    stubFetchOk()
    const { container } = render(<DropZone />)
    const overlay = container.querySelector('[data-state]') as HTMLElement

    await act(async () => {
      document.body.dispatchEvent(makeDragEvent('dragenter', document.body, { types: ['Files'] }))
      document.body.dispatchEvent(
        makeDragEvent('drop', document.body, {
          files: [new File([''], 'x.txt', { type: 'text/plain' })],
          types: ['Files'],
        }),
      )
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(overlay.dataset.state).toBe('closed')
  })

  test('drag originating inside an <input> does not activate the overlay', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    const { container } = render(<DropZone />)
    const overlay = container.querySelector('[data-state]') as HTMLElement

    act(() => {
      document.body.dispatchEvent(makeDragEvent('dragenter', input, { types: ['Files'] }))
    })

    expect(overlay.dataset.state).toBe('closed')
    document.body.removeChild(input)
  })
})

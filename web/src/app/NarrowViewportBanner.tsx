import { useEffect, useState } from 'react'

const MIN_WIDTH = 1280
const DEBOUNCE_MS = 200

export function NarrowViewportBanner() {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MIN_WIDTH,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const onResize = () => {
      if (timeoutId !== null) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsNarrow(window.innerWidth < MIN_WIDTH)
      }, DEBOUNCE_MS)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [])

  if (!isNarrow) return null

  return (
    <div className="mx-auto mt-4 max-w-4xl rounded-md bg-warning-subtle-bg p-4 text-body text-text-muted">
      LatestNews is optimised for 1280×720 or larger. Some interactions may be cramped below this
      width.
    </div>
  )
}

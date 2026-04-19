import { Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getTheme, setTheme, type ThemeMode } from '@/design/theme'

const CYCLE: Record<ThemeMode, { next: ThemeMode; ariaLabel: string }> = {
  light: { next: 'dark', ariaLabel: 'Switch to dark' },
  dark: { next: 'system', ariaLabel: 'Switch to system' },
  system: { next: 'light', ariaLabel: 'Switch to light' },
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => getTheme())

  useEffect(() => {
    setMode(getTheme())
  }, [])

  const handleClick = useCallback(() => {
    const next = CYCLE[mode].next
    setTheme(next)
    setMode(next)
  }, [mode])

  const { ariaLabel } = CYCLE[mode]

  return (
    <Button
      variant="ghost"
      size="md"
      aria-label={ariaLabel}
      onClick={handleClick}
      className="size-9 p-0"
    >
      {mode === 'light' && <Sun className="size-4" aria-hidden />}
      {mode === 'dark' && <Moon className="size-4" aria-hidden />}
      {mode === 'system' && <Monitor className="size-4" aria-hidden />}
    </Button>
  )
}

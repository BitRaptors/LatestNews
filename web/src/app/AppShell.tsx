import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import { DURATION_BASE, enter } from '@/design/motion'
import { HelpButton } from './HelpButton'
import { HelpOverlay } from './HelpOverlay'
import { KCmdAffordance } from './KCmdAffordance'
import { NarrowViewportBanner } from './NarrowViewportBanner'
import { ThemeToggle } from './ThemeToggle'
import { useGlobalShortcuts } from './useGlobalShortcuts'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/explore': 'Explore',
  '/settings': 'Settings',
}

function getRouteLabel(pathname: string): string {
  return ROUTE_LABELS[pathname] ?? 'Not found'
}

export function AppShell() {
  const location = useLocation()
  const routeName = getRouteLabel(location.pathname)
  const [helpOpen, setHelpOpen] = useState(false)

  const openHelp = useCallback(() => setHelpOpen(true), [])
  const toggleHelp = useCallback(() => setHelpOpen((open) => !open), [])
  const openPaletteStub = useCallback(() => {
    // biome-ignore lint/suspicious/noConsole: Story 4.3 will replace this with the real command palette wiring
    console.info('palette goto Story 4.3')
  }, [])

  useGlobalShortcuts({
    onShowHelp: toggleHelp,
    onOpenPalette: openPaletteStub,
  })

  return (
    <>
      <div className="min-h-screen">
        <header className="flex h-12 items-center justify-between border-b border-border-default px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-heading-3 font-semibold text-text-primary">
              LatestNews
            </Link>
            <span className="h-4 w-px bg-border-default" aria-hidden />
            <AnimatePresence mode="wait">
              <motion.span
                key={routeName}
                initial={enter.initial}
                animate={enter.animate}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION_BASE / 1000 }}
                className="text-body text-text-muted"
                aria-live="polite"
              >
                {routeName}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton onClick={openHelp} />
            <span className="h-4 w-px bg-border-default" aria-hidden />
            <ThemeToggle />
            <span className="h-4 w-px bg-border-default" aria-hidden />
            <KCmdAffordance />
          </div>
        </header>
        <NarrowViewportBanner />
        <Outlet />
      </div>
      <HelpOverlay open={helpOpen} onOpenChange={setHelpOpen} />
      <Toaster closeButton toastOptions={{ duration: DURATION_BASE }} />
    </>
  )
}

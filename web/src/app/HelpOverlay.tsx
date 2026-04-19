import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isMacPlatform } from './platform'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Shortcut = {
  keys: string[]
  description: string
}

function shortcuts(): Shortcut[] {
  const modifier = isMacPlatform() ? '⌘' : 'Ctrl'
  return [
    { keys: [`${modifier} 1`], description: 'Go to Dashboard' },
    { keys: [`${modifier} 2`], description: 'Go to Explore' },
    { keys: [`${modifier} 3`], description: 'Go to Settings' },
    { keys: [`${modifier} K`], description: 'Open command palette' },
    { keys: ['?'], description: 'Toggle this help overlay' },
    { keys: ['Esc'], description: 'Close overlays / dialogs' },
  ]
}

export function HelpOverlay({ open, onOpenChange }: Props) {
  const rows = shortcuts()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Every global shortcut is listed below.</DialogDescription>
        </DialogHeader>
        <ul className="mt-2 space-y-3">
          {rows.map(({ keys, description }) => (
            <li key={description} className="flex items-center justify-between gap-4">
              <span className="text-body-sm text-text-muted">{description}</span>
              <span className="flex gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="text-label rounded-sm border border-border-default bg-surface-tertiary px-2 py-1 text-text-primary"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

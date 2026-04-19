import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  onClick: () => void
}

export function HelpButton({ onClick }: Props) {
  return (
    <Button
      variant="ghost"
      size="md"
      aria-label="Show keyboard shortcuts"
      onClick={onClick}
      className="size-9 p-0"
    >
      <HelpCircle className="size-4" aria-hidden />
    </Button>
  )
}

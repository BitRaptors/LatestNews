import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundRoute() {
  const navigate = useNavigate()
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-16 text-center">
      <h1 className="text-heading-2 font-semibold">Page not found</h1>
      <p className="text-body text-text-muted">
        The path you requested doesn't match any route in this app.
      </p>
      <Button variant="secondary" onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </main>
  )
}

import { CaptureInput } from '@/features/capture/CaptureInput'
import { DropZone } from '@/features/capture/DropZone'

export function DashboardRoute() {
  return (
    <>
      <main className="mx-auto max-w-3xl p-8">
        <CaptureInput />
        <p className="mt-4 text-body-sm text-text-muted">Your captured items will appear here.</p>
      </main>
      <DropZone />
    </>
  )
}

// TODO(Story 1.5): replace with AppShell — this gallery only exists to prove
// the tokenized shadcn primitives render correctly.

import { Toaster, toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function App() {
  return (
    <TooltipProvider>
      <main className="mx-auto max-w-2xl space-y-8 p-8">
        <header className="space-y-2">
          <h1 className="text-heading-1 font-semibold">Hello LatestNews</h1>
          <p className="text-body text-text-muted">
            Token + shadcn foundation gallery. Replaced by the real AppShell in Story 1.5.
          </p>
        </header>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-heading-3 font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-heading-3 font-semibold">Input + Label</h2>
          <div className="space-y-2">
            <Label htmlFor="demo-input">What are you thinking about?</Label>
            <Input id="demo-input" placeholder="Paste a link or type a note…" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-heading-3 font-semibold">Dialog + Toast</h2>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Token flow preview</DialogTitle>
                  <DialogDescription>
                    The dialog surface, border, and shadow all come from design tokens — no raw
                    colours in source.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      toast.success('Toast fired from a tokenized Sonner.')
                    }}
                  >
                    Fire toast
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="secondary"
              onClick={() => {
                toast('Hello from Sonner.', {
                  description: 'Enter / exit timings match motion tokens.',
                })
              }}
            >
              Toast directly
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-heading-3 font-semibold">Tooltip + Avatar</h2>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Kbd ⌘K opens the palette</TooltipContent>
            </Tooltip>
            <Avatar>
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-heading-3 font-semibold">Skeleton (load state)</h2>
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </section>

        <Toaster richColors closeButton />
      </main>
    </TooltipProvider>
  )
}

export default App

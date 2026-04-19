import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Primary foundation button — tokenized per UX Design Spec § Component Library.
 *
 * Variants map to the four UX roles (primary / secondary / ghost / destructive).
 * Sizes are 28 / 36 / 44 px. Focus ring uses `--shadow-glow-accent`. Pressed
 * state uses a CSS transform (`active:scale-[0.96]`) with our fast duration
 * token — matches the Motion `press` variant spec without the component-wrapping
 * complexity. When a feature story needs spring physics, swap the active:scale
 * for `<motion.button whileTap={press.whileTap}>` at that time.
 *
 * Primary variant uses `--gradient-accent-diagonal` (dark-blue-to-neon-green);
 * the gradient references our colour tokens so it flips with theme automatically.
 *
 * Also exposes two compatibility sizes (`icon-sm`) and one variant (`outline`)
 * required by shadcn's internal Dialog / Sheet close buttons. Those map to
 * sensible tokenized equivalents so we don't fork those upstream components.
 */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md',
    'text-sm font-medium whitespace-nowrap select-none',
    'transition-[transform,colors,box-shadow] duration-fast ease-standard',
    'active:scale-[0.96]',
    'outline-none focus-visible:outline-none focus-visible:shadow-glow-accent',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[image:var(--gradient-accent-diagonal)] text-text-inverted',
          'hover:shadow-glow-accent',
        ].join(' '),
        secondary: [
          'bg-surface-secondary text-text-primary border border-border-default',
          'hover:bg-surface-tertiary',
        ].join(' '),
        ghost: ['bg-transparent text-text-primary', 'hover:bg-surface-tertiary'].join(' '),
        destructive: ['bg-error text-text-inverted', 'hover:opacity-90'].join(' '),
        // Compatibility: shadcn's Dialog / Sheet close buttons pass variant="outline".
        outline: [
          'bg-transparent text-text-primary border border-border-default',
          'hover:bg-surface-tertiary',
        ].join(' '),
      },
      size: {
        sm: 'h-7 px-3', // 28px
        md: 'h-9 px-4', // 36px — default
        lg: 'h-11 px-5 text-base', // 44px
        // Compatibility with shadcn's Dialog / Sheet internal close buttons.
        'icon-sm': 'size-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'primary'}
      data-size={size ?? 'md'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

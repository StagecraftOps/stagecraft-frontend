import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
        secondary:
          'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300 border border-zinc-200',
        danger:
          'bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 shadow-sm',
        ghost:
          'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 active:bg-zinc-200',
        outline:
          'border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:border-zinc-300',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

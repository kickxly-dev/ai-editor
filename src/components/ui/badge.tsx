import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-crimson/30 bg-crimson/10 text-crimson',
        secondary: 'border-border bg-surface text-text-secondary',
        outline: 'border-border text-text-secondary',
        success: 'border-green-500/30 bg-green-500/10 text-green-400',
        warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
        info: 'border-neon-blue/30 bg-neon-blue/10 text-neon-blue',
        purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        tier_S: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400',
        tier_A: 'border-green-400/30 bg-green-400/10 text-green-400',
        tier_B: 'border-blue-400/30 bg-blue-400/10 text-blue-400',
        tier_C: 'border-orange-400/30 bg-orange-400/10 text-orange-400',
        tier_D: 'border-red-400/30 bg-red-400/10 text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

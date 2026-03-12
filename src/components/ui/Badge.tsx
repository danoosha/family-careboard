import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'warning' | 'success' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variant === 'default' && 'bg-stone-100 text-stone-600',
      variant === 'warning' && 'bg-amber-100 text-amber-700',
      variant === 'success' && 'bg-green-100 text-green-700',
      variant === 'info' && 'bg-blue-100 text-blue-700',
      className
    )}>
      {children}
    </span>
  )
}

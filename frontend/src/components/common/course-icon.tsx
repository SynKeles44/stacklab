import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function CourseIcon({ icon, color, className, size = 'md' }: { icon: string | null; color: string | null; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = iconFor(icon)
  const sizes = { sm: 'size-8 rounded-lg [&_svg]:size-4', md: 'size-11 rounded-xl [&_svg]:size-5', lg: 'size-16 rounded-2xl [&_svg]:size-8' }
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center ring-1 ring-inset', sizes[size], className)}
      style={{
        color: color ?? 'var(--brand)',
        backgroundColor: `color-mix(in oklab, ${color ?? 'var(--brand)'} 14%, transparent)`,
        ['--tw-ring-color' as string]: `color-mix(in oklab, ${color ?? 'var(--brand)'} 30%, transparent)`,
      }}
    >
      <Icon />
    </span>
  )
}

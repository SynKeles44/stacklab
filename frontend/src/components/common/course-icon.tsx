import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function CourseIcon({ icon, color, className, size = 'md', solid = false }: { icon: string | null; color: string | null; className?: string; size?: 'sm' | 'md' | 'lg'; solid?: boolean }) {
  const Icon = iconFor(icon)
  const sizes = { sm: 'size-8 rounded-lg [&_svg]:size-4', md: 'size-11 rounded-xl [&_svg]:size-5', lg: 'size-16 rounded-2xl [&_svg]:size-8' }
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', sizes[size], className)}
      style={
        solid
          ? { color: '#fff', backgroundColor: color ?? 'var(--brand)' }
          : {
              color: color ?? 'var(--brand)',
              backgroundColor: `color-mix(in oklab, ${color ?? 'var(--brand)'} 12%, transparent)`,
            }
      }
    >
      <Icon />
    </span>
  )
}

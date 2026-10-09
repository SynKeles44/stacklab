import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 50" className={cn('h-7 w-auto', className)} aria-hidden="true">
      <defs>
        <linearGradient id="stacklab-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M28 36 6 25.5l22-10.5 22 10.5z" fill="#7c3aed" opacity=".55" />
      <path d="M28 28.5 6 18 28 7.5 50 18z" fill="url(#stacklab-mark)" />
      <path d="M6 33 28 43.5 50 33" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <LogoMark />
      <span className="text-lg">
        Stack<span className="text-brand">lab</span>
      </span>
    </span>
  )
}

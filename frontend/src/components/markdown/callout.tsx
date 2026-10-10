import { AlertTriangle, Bug, Info, Lightbulb, type LucideIcon, Pin, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const STYLES: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  merksatz: { label: 'Merksatz', icon: Pin, className: 'bg-brand/[0.07] before:bg-brand [&_[data-icon]]:text-brand' },
  fehler: { label: 'Typischer Fehler', icon: Bug, className: 'bg-destructive/[0.07] before:bg-destructive [&_[data-icon]]:text-destructive' },
  praxis: { label: 'Aus der Praxis', icon: Wrench, className: 'bg-brand-2/[0.09] before:bg-brand-2 [&_[data-icon]]:text-brand-2' },
  tipp: { label: 'Tipp', icon: Lightbulb, className: 'bg-success/[0.08] before:bg-success [&_[data-icon]]:text-success' },
  hinweis: { label: 'Hinweis', icon: Info, className: 'bg-muted before:bg-muted-foreground/40 [&_[data-icon]]:text-muted-foreground' },
  achtung: { label: 'Achtung', icon: AlertTriangle, className: 'bg-warning/[0.1] before:bg-warning [&_[data-icon]]:text-warning' },
}

export function Callout({ type, children }: { type: string; children: ReactNode }) {
  const style = STYLES[type] ?? STYLES.hinweis!
  const Icon = style.icon
  return (
    <aside className={cn('not-prose relative overflow-hidden rounded-xl py-4 pr-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] sm:py-5 sm:pr-5 sm:pl-6', style.className)}>
      <div className="mb-1.5 flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.01em]">
        <Icon data-icon className="size-4" />
        {style.label}
      </div>
      <div className="space-y-3 text-[0.98rem] leading-7 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-background/70 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.88em] [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </aside>
  )
}

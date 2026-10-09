import { AlertTriangle, Bug, Info, Lightbulb, type LucideIcon, Pin, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const STYLES: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  merksatz: { label: 'Merksatz', icon: Pin, className: 'border-brand/40 bg-brand/8 [&_[data-icon]]:text-brand' },
  fehler: { label: 'Typischer Fehler', icon: Bug, className: 'border-destructive/40 bg-destructive/8 [&_[data-icon]]:text-destructive' },
  praxis: { label: 'Aus der Praxis', icon: Wrench, className: 'border-brand-2/50 bg-brand-2/10 [&_[data-icon]]:text-brand-2' },
  tipp: { label: 'Tipp', icon: Lightbulb, className: 'border-success/40 bg-success/8 [&_[data-icon]]:text-success' },
  hinweis: { label: 'Hinweis', icon: Info, className: 'border-border bg-muted/60 [&_[data-icon]]:text-muted-foreground' },
  achtung: { label: 'Achtung', icon: AlertTriangle, className: 'border-warning/50 bg-warning/10 [&_[data-icon]]:text-warning' },
}

export function Callout({ type, children }: { type: string; children: ReactNode }) {
  const style = STYLES[type] ?? STYLES.hinweis!
  const Icon = style.icon
  return (
    <aside className={cn('not-prose rounded-xl border-l-4 border p-4 sm:p-5', style.className)}>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        <Icon data-icon className="size-4" />
        {style.label}
      </div>
      <div className="space-y-3 text-[0.98rem] leading-7 [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-background/70 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.88em] [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </aside>
  )
}

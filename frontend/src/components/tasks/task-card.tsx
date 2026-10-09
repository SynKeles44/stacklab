import { CheckCircle2, ChevronDown, Lightbulb, type LucideIcon, ScrollText } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Task } from '@/lib/content-schemas'
import { cn } from '@/lib/utils'

export function SmallMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('lesson-prose text-[0.98rem] [&>*+*]:mt-3', className)}>
      <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
    </div>
  )
}

export function TaskCard({ task, icon: Icon, label, done, children, attempted }: { task: Task; icon: LucideIcon; label: string; done: boolean; children: ReactNode; attempted: boolean }) {
  const [hintsShown, setHintsShown] = useState(0)
  const hints = task.hints ?? []

  return (
    <Card id={`aufgabe-${task.id}`} className={cn('scroll-mt-24 overflow-hidden transition-colors', done && 'border-success/40')}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Icon className="size-3.5" /> {label}
          </Badge>
          {done && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <Badge className="gap-1 bg-success text-white">
                <CheckCircle2 className="size-3.5" /> Gelöst
              </Badge>
            </motion.span>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-snug">{task.title}</h3>
        <SmallMarkdown text={task.description} />
      </CardHeader>
      <CardContent className="space-y-4">
        {children}

        {(hints.length > 0 || task.solution) && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {hints.length > 0 && hintsShown < hints.length && (
              <Button variant="outline" size="sm" onClick={() => setHintsShown(hintsShown + 1)}>
                <Lightbulb /> {hintsShown === 0 ? 'Tipp anzeigen' : 'Noch ein Tipp'}
              </Button>
            )}
          </div>
        )}
        {hintsShown > 0 && (
          <ul className="space-y-2">
            {hints.slice(0, hintsShown).map((hint, index) => (
              <motion.li key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                <SmallMarkdown text={hint} className="text-sm" />
              </motion.li>
            ))}
          </ul>
        )}
        {task.solution && (attempted || done) && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="group text-muted-foreground">
                <ScrollText /> Musterlösung <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-lg border bg-muted/40 p-4">
              <SmallMarkdown text={task.solution} className="text-sm" />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

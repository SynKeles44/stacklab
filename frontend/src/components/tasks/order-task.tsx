import { ArrowDown, ArrowUp, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TaskOf } from '@/lib/content-schemas'
import { seededShuffle } from '@/lib/format'
import { cn } from '@/lib/utils'
import { InlineMarkdown } from '@/components/quiz/question-view'

export function OrderTask({ task, onSolved, onAttempt }: { task: TaskOf<'order'>; onSolved: () => void; onAttempt: () => void }) {
  const initial = useMemo(() => {
    let shuffled = seededShuffle(task.items.map((_, index) => index), task.id)
    if (shuffled.every((value, index) => value === index)) shuffled = [...shuffled].reverse()
    return shuffled
  }, [task])
  const [order, setOrder] = useState(initial)
  const [checked, setChecked] = useState(false)
  const correct = order.every((value, index) => value === index)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return
    setChecked(false)
    setOrder((previous) => {
      const next = [...previous]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item!)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {order.map((item, position) => (
          <motion.li
            layout
            key={item}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className={cn('flex items-center gap-3 rounded-xl border bg-card p-2 pl-3', checked && (item === position ? 'border-success bg-success/8' : 'border-destructive bg-destructive/8'))}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{position + 1}</span>
            <InlineMarkdown text={task.items[item]!} className="flex-1 text-sm" />
            <div className="flex">
              <Button variant="ghost" size="icon-sm" onClick={() => move(position, position - 1)} disabled={position === 0} aria-label="Nach oben">
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => move(position, position + 1)} disabled={position === order.length - 1} aria-label="Nach unten">
                <ArrowDown />
              </Button>
            </div>
          </motion.li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setChecked(true)
            onAttempt()
            if (correct) onSolved()
          }}
        >
          Reihenfolge prüfen
        </Button>
        {checked && (
          <span className={cn('flex items-center gap-1.5 text-sm font-medium', correct ? 'text-success' : 'text-destructive')}>
            {correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {correct ? 'Genau richtig!' : 'Noch nicht – rot markierte Schritte stehen falsch.'}
          </span>
        )}
      </div>
    </div>
  )
}

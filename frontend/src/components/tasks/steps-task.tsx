import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { InlineMarkdown } from '@/components/quiz/question-view'
import type { TaskOf } from '@/lib/content-schemas'
import { cn } from '@/lib/utils'
import { SmallMarkdown } from './task-card'

export function StepsTask({ task, onSolved, onAttempt }: { task: TaskOf<'steps'>; onSolved: () => void; onAttempt: () => void }) {
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)
  const step = task.steps[index]!
  const answered = choice !== null
  const correct = choice === step.answer

  const choose = (option: number) => {
    if (answered && correct) return
    setChoice(option)
    onAttempt()
    if (option !== step.answer) setMistakes((m) => m + 1)
  }

  const next = () => {
    if (index < task.steps.length - 1) {
      setIndex(index + 1)
      setChoice(null)
    } else {
      setFinished(true)
      onSolved()
    }
  }

  if (finished) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/8 p-4 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-2 font-semibold">Ablauf komplett durchgespielt!</p>
        <p className="text-sm text-muted-foreground">{mistakes === 0 ? 'Ohne einen einzigen Fehler.' : `Mit ${mistakes} Fehlversuch${mistakes === 1 ? '' : 'en'} – beim nächsten Mal sitzt es.`}</p>
        <Button variant="ghost" className="mt-2" onClick={() => { setFinished(false); setIndex(0); setChoice(null); setMistakes(0) }}>Nochmal</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={(index / task.steps.length) * 100} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground">Schritt {index + 1} / {task.steps.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
          <div className="rounded-xl border-l-4 border-brand-2 bg-brand-2/8 p-4">
            <p className="mb-1 text-xs font-semibold tracking-wide text-brand-2 uppercase">Situation</p>
            <SmallMarkdown text={step.situation} />
          </div>
          <InlineMarkdown text={step.question} className="font-semibold" />
          <div className="grid gap-2">
            {step.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                type="button"
                onClick={() => choose(optionIndex)}
                className={cn(
                  'rounded-xl border p-3 text-left text-sm transition-colors hover:bg-muted/60',
                  choice === optionIndex && (correct ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'),
                )}
              >
                <InlineMarkdown text={option} />
              </button>
            ))}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('rounded-xl p-3 text-sm', correct ? 'bg-success/10' : 'bg-destructive/10')}>
              <p className="flex items-center gap-1.5 font-semibold">
                {correct ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}
                {correct ? 'Richtig!' : 'Nicht ganz – versuch es nochmal.'}
              </p>
              {correct && step.explanation && <InlineMarkdown text={step.explanation} className="mt-1" />}
            </motion.div>
          )}
          {answered && correct && (
            <div className="flex justify-end">
              <Button onClick={next}>{index < task.steps.length - 1 ? 'Was passiert dann?' : 'Abschließen'} <ArrowRight /></Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

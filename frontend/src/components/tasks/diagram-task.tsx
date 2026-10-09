import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TaskOf } from '@/lib/content-schemas'
import { seededShuffle } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DiagramTask({ task, onSolved, onAttempt }: { task: TaskOf<'diagram'>; onSolved: () => void; onAttempt: () => void }) {
  const labels = useMemo(() => seededShuffle([...task.slots.map((slot) => slot.answer), ...(task.distractors ?? [])], task.id), [task])
  const [values, setValues] = useState<(string | null)[]>(() => task.slots.map(() => null))
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const complete = values.every((value) => value !== null)
  const correct = complete && task.slots.every((slot, index) => values[index] === slot.answer)

  const assign = (index: number) => {
    setChecked(false)
    if (selected === null) {
      setValues((previous) => previous.map((value, i) => (i === index ? null : value)))
      return
    }
    setValues((previous) => previous.map((value, i) => (i === index ? selected : value === selected ? null : value)))
    setSelected(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Tippe eine Beschriftung an und danach das Feld, in das sie gehört. Ein besetztes Feld leerst du durch erneutes Antippen.</p>
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Beschriftungen">
        {labels.map((label) => {
          const used = values.includes(label)
          return (
            <button
              key={label}
              type="button"
              role="option"
              aria-selected={selected === label}
              onClick={() => setSelected(selected === label ? null : label)}
              className={cn(
                'rounded-lg border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:border-brand',
                selected === label && 'border-brand bg-brand/15 ring-2 ring-brand',
                used && selected !== label && 'opacity-45',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="relative overflow-hidden rounded-xl border bg-white p-2">
        <img src={task.image} alt={task.title} className="w-full" />
        {task.slots.map((slot, index) => (
          <button
            key={index}
            type="button"
            onClick={() => assign(index)}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            aria-label={values[index] ? `Feld ${index + 1}: ${values[index]}` : `Feld ${index + 1} (leer)`}
            className={cn(
              'absolute max-w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 bg-white px-2 py-1 text-xs font-semibold text-slate-900 shadow-md transition-all sm:text-sm',
              values[index] ? 'border-violet-600' : 'border-dashed border-slate-400 text-slate-500',
              selected !== null && 'animate-pulse ring-2 ring-violet-400/60',
              checked && (values[index] === slot.answer ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50'),
            )}
          >
            {values[index] ?? `Feld ${index + 1}`}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!complete}
          onClick={() => {
            setChecked(true)
            onAttempt()
            if (correct) onSolved()
          }}
        >
          Beschriftung prüfen
        </Button>
        <Button variant="ghost" onClick={() => { setValues(task.slots.map(() => null)); setChecked(false); setSelected(null) }}>
          <RotateCcw /> Leeren
        </Button>
        {checked && (
          <span className={cn('flex items-center gap-1.5 text-sm font-medium', correct ? 'text-success' : 'text-destructive')}>
            {correct ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {correct ? 'Perfekt beschriftet!' : 'Einige Felder stimmen noch nicht.'}
          </span>
        )}
      </div>
    </div>
  )
}

import { CheckCircle2, XCircle } from 'lucide-react'
import { Fragment } from 'react'
import Markdown from 'react-markdown'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PublicQuestion, Question } from '@/lib/content-schemas'
import type { Answer } from '@/lib/quiz'
import { cn } from '@/lib/utils'

type Props = {
  question: PublicQuestion
  value: Answer
  onChange: (value: Answer) => void
  /** When set, the solution is revealed and inputs are locked. */
  reveal?: Question | null
  idPrefix: string
}

const TYPE_LABELS: Record<PublicQuestion['type'], string> = {
  single: 'Eine Antwort ist richtig',
  multiple: 'Mehrere Antworten können richtig sein',
  cloze: 'Lückentext',
  match: 'Zuordnung',
  'find-bug': 'Finde den Fehler – klicke auf die fehlerhafte Zeile',
}

export function InlineMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.88em] [&_p]:inline', className)}>
      <Markdown allowedElements={['p', 'code', 'strong', 'em']} unwrapDisallowed>
        {text}
      </Markdown>
    </div>
  )
}

export function QuestionView({ question, value, onChange, reveal, idPrefix }: Props) {
  const locked = Boolean(reveal)
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{TYPE_LABELS[question.type]}</p>
        {'question' in question && question.question && <InlineMarkdown text={question.question} className="mt-1 text-lg font-semibold leading-snug" />}
      </div>

      {question.type === 'single' && (
        <RadioGroup value={value === null ? '' : String(value)} onValueChange={(next) => onChange(Number(next))} disabled={locked} className="gap-2">
          {question.options.map((option, index) => {
            const correct = reveal?.type === 'single' && reveal.answer === index
            const wrong = reveal?.type === 'single' && value === index && !correct
            return (
              <Label
                key={index}
                htmlFor={`${idPrefix}-${index}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/5',
                  correct && 'border-success! bg-success/10!',
                  wrong && 'border-destructive! bg-destructive/10!',
                )}
              >
                <RadioGroupItem id={`${idPrefix}-${index}`} value={String(index)} />
                <InlineMarkdown text={option} className="flex-1" />
                {correct && <CheckCircle2 className="size-5 text-success" />}
                {wrong && <XCircle className="size-5 text-destructive" />}
              </Label>
            )
          })}
        </RadioGroup>
      )}

      {question.type === 'multiple' && (
        <div className="grid gap-2">
          {question.options.map((option, index) => {
            const selected = Array.isArray(value) && (value as number[]).includes(index)
            const correct = reveal?.type === 'multiple' && reveal.answers.includes(index)
            return (
              <Label
                key={index}
                htmlFor={`${idPrefix}-${index}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:bg-muted/60',
                  selected && 'border-brand bg-brand/5',
                  reveal && correct && 'border-success bg-success/10',
                  reveal && selected && !correct && 'border-destructive bg-destructive/10',
                )}
              >
                <Checkbox
                  id={`${idPrefix}-${index}`}
                  checked={selected}
                  disabled={locked}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(value) ? (value as number[]) : []
                    onChange(checked ? [...current, index] : current.filter((item) => item !== index))
                  }}
                />
                <InlineMarkdown text={option} className="flex-1" />
                {reveal && correct && <CheckCircle2 className="size-5 text-success" />}
              </Label>
            )
          })}
        </div>
      )}

      {question.type === 'cloze' && (
        <ClozeView text={question.text} value={(value as string[]) ?? []} onChange={onChange} locked={locked} reveal={reveal?.type === 'cloze' ? reveal.blanks : null} idPrefix={idPrefix} />
      )}

      {question.type === 'match' && (
        <div className="grid gap-2">
          {question.lefts.map((left, index) => {
            const chosen = (value as string[] | null)?.[index] ?? ''
            const expected = reveal?.type === 'match' ? reveal.pairs[index]?.right : undefined
            return (
              <div key={index} className={cn('grid items-center gap-2 rounded-xl border p-3 sm:grid-cols-2', expected !== undefined && (chosen === expected ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'))}>
                <code className="font-mono text-sm break-words">{left}</code>
                <Select
                  value={chosen}
                  disabled={locked}
                  onValueChange={(next) => {
                    const current = Array.isArray(value) ? [...(value as string[])] : question.lefts.map(() => '')
                    current[index] = next
                    onChange(current)
                  }}
                >
                  <SelectTrigger className="w-full" aria-label={`Zuordnung für ${left}`}>
                    <SelectValue placeholder="Auswählen …" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.rights.map((right) => (
                      <SelectItem key={right} value={right}>{right}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {expected !== undefined && chosen !== expected && <p className="text-sm text-success sm:col-span-2">Richtig wäre: {expected}</p>}
              </div>
            )
          })}
        </div>
      )}

      {question.type === 'find-bug' && (
        <div className="overflow-x-auto rounded-xl border bg-[oklch(0.19_0.03_285)] py-2 font-mono text-sm text-white/90">
          {question.code.replace(/\n$/, '').split('\n').map((line, index) => {
            const number = index + 1
            const selected = value === number
            const bug = reveal?.type === 'find-bug' && reveal.bug_line === number
            return (
              <button
                key={index}
                type="button"
                disabled={locked}
                onClick={() => onChange(number)}
                className={cn(
                  'flex w-full min-w-max items-start gap-4 px-3 py-0.5 text-left transition-colors hover:bg-white/10',
                  selected && 'bg-brand/40 hover:bg-brand/40',
                  reveal && bug && 'bg-emerald-500/30',
                  reveal && selected && !bug && 'bg-red-500/30',
                )}
                aria-pressed={selected}
              >
                <span className="w-6 shrink-0 text-right text-white/40 select-none">{number}</span>
                <span className="whitespace-pre">{line || ' '}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ClozeView({ text, value, onChange, locked, reveal, idPrefix }: { text: string; value: string[]; onChange: (value: Answer) => void; locked: boolean; reveal: string[][] | null; idPrefix: string }) {
  const parts = text.split('___')
  return (
    <div className="rounded-xl border bg-muted/30 p-4 text-base leading-[2.6]">
      {parts.map((part, index) => (
        <Fragment key={index}>
          <InlineMarkdown text={part} className="inline" />
          {index < parts.length - 1 && (
            <span className="inline-flex flex-col align-middle">
              <Input
                id={`${idPrefix}-${index}`}
                aria-label={`Lücke ${index + 1}`}
                value={value[index] ?? ''}
                disabled={locked}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                onChange={(event) => {
                  const next = [...value]
                  next[index] = event.target.value
                  onChange(next)
                }}
                className={cn(
                  'mx-1 inline-flex h-8 w-36 font-mono',
                  reveal && (reveal[index]?.map((v) => v.toLowerCase().trim()).includes((value[index] ?? '').toLowerCase().trim()) ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'),
                )}
              />
              {reveal && !reveal[index]?.map((v) => v.toLowerCase().trim()).includes((value[index] ?? '').toLowerCase().trim()) && (
                <span className="mx-1 text-xs leading-tight text-success">{reveal[index]?.[0]}</span>
              )}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}

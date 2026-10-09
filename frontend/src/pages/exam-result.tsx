import { ArrowLeft, Award, CheckCircle2, Printer, RotateCcw, TrendingDown, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useLoaderData } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { InlineMarkdown } from '@/components/quiz/question-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ExamResult } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { celebrateBig } from '@/lib/celebrate'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ExamResultPage() {
  const { attempt, exam } = useLoaderData() as ExamResult
  const user = useSession()
  const result = attempt.result
  const percent = result?.percent ?? 0
  const weak = result?.modules.filter((module) => module.weak) ?? []

  useEffect(() => {
    document.title = `Ergebnis · ${exam.title} · Stacklab`
    if (attempt.passed) celebrateBig()
  }, [attempt.passed, exam.title])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to={`/kurse/${exam.course.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" /> {exam.course.title}
      </Link>

      {attempt.passed && (
        <motion.section
          initial={{ opacity: 0, transform: 'scale(0.97)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
          className="mt-6 rounded-2xl bg-card p-8 text-center shadow-raised outline outline-1 outline-offset-[-10px] outline-border sm:p-12 print:shadow-none"
        >
          <div>
            <LogoMark className="mx-auto h-12" />
            <p className="mt-4 text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">Zertifikat</p>
            <p className="mt-6 text-muted-foreground">Hiermit wird bestätigt, dass</p>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{attempt.user_name ?? user?.name ?? 'Lernende:r'}</p>
            <p className="mt-4 text-muted-foreground">die Abschlussprüfung des Kurses</p>
            <p className="mt-1 text-2xl font-semibold">{exam.course.title}</p>
            <p className="mt-4 text-muted-foreground">mit <strong className="text-foreground">{percent} %</strong> erfolgreich bestanden hat.</p>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>{formatDate(attempt.finished_at)}</span>
              <Award className="size-8 text-warning" />
              <span>Stacklab</span>
            </div>
          </div>
        </motion.section>
      )}

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row">
          <div className={cn('flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-8', attempt.passed ? 'border-success/60' : 'border-destructive/50')}>
            <span className="text-3xl font-bold tabular-nums">{percent}%</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <Badge className={cn(attempt.passed ? 'bg-success text-white' : 'bg-destructive text-white')}>{attempt.passed ? 'Bestanden' : 'Nicht bestanden'}</Badge>
            <h1 className="mt-2 text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">{attempt.score} von {attempt.max_score} Punkten · bestanden ab {exam.pass_percent} %</p>
          </div>
          <div className="flex flex-col gap-2 print:hidden">
            {attempt.passed && <Button variant="outline" onClick={() => window.print()}><Printer /> Zertifikat drucken</Button>}
            <Button asChild variant={attempt.passed ? 'ghost' : 'default'}><Link to={`/kurse/${exam.course.slug}/pruefung`}><RotateCcw /> Neuer Versuch</Link></Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6 print:hidden">
          <CardHeader><CardTitle>Schwächenanalyse</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.modules.map((module) => (
              <div key={module.module}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={cn('font-medium', module.weak && 'text-destructive')}>{module.title}</span>
                  <span className="tabular-nums text-muted-foreground">{module.score} / {module.max} · {module.percent} %</span>
                </div>
                <Progress value={module.percent} className={cn('h-2', module.weak && '[&>[data-slot=progress-indicator]]:bg-destructive')} />
              </div>
            ))}
            {weak.length > 0 ? (
              <div className="rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold"><TrendingDown className="size-4" /> Hier lohnt sich eine Wiederholung</p>
                <p className="mt-1 text-muted-foreground">
                  {weak.map((module) => module.title).join(', ')} – öffne die Module in der <Link to={`/kurse/${exam.course.slug}`} className="text-brand hover:underline">Kursübersicht</Link> und arbeite die Aufgaben noch einmal durch.
                </p>
              </div>
            ) : (
              <p className="text-sm text-success">In allen Modulen über 60 % – stark!</p>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <section className="mt-8 print:hidden">
          <h2 className="mb-3 text-lg font-semibold">Auflösung</h2>
          <ol className="space-y-2">
            {result.details.map((detail, i) => {
              const question = detail.kind === 'question' && detail.index !== undefined ? exam.questions[detail.index] : null
              return (
                <li key={i} className={cn('rounded-xl border p-4 text-sm', detail.correct ? 'border-success/30' : 'border-destructive/30')}>
                  <div className="flex items-start gap-2">
                    {detail.correct ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                    <div className="min-w-0">
                      {question ? (
                        <InlineMarkdown text={'question' in question && question.question ? question.question : question.type === 'cloze' ? question.text : ''} className="font-medium" />
                      ) : (
                        <p className="font-medium">Praxis-Aufgabe „{detail.id}“</p>
                      )}
                      {detail.explanation && <InlineMarkdown text={detail.explanation} className="mt-1 text-muted-foreground" />}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}

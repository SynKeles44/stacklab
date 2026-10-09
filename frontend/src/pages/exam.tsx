import { AlarmClock, ArrowLeft, ArrowRight, Award, CheckCircle2, Clock, FileQuestion, History, Send, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { CourseIcon } from '@/components/common/course-icon'
import { QuestionView } from '@/components/quiz/question-view'
import { CodeTask } from '@/components/tasks/code-task'
import { SmallMarkdown } from '@/components/tasks/task-card'
import { RealTerminal } from '@/components/code/lazy'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Api, type ExamInfo, type ExamStart } from '@/lib/api'
import { useSession } from '@/lib/auth'
import type { Task } from '@/lib/content-schemas'
import { formatDateTime } from '@/lib/format'
import { emptyAnswer, isAnswered, type Answer } from '@/lib/quiz'
import { cn } from '@/lib/utils'

export function ExamPage() {
  const info = useLoaderData() as ExamInfo
  const user = useSession()
  const [session, setSession] = useState<ExamStart | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    document.title = `${info.exam.title} · Stacklab`
  }, [info.exam.title])

  if (session) return <ExamRunner info={info} session={session} />

  const start = async () => {
    setStarting(true)
    try {
      setSession(await Api.startExam(info.exam.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prüfung konnte nicht gestartet werden')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to={`/kurse/${info.exam.course.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {info.exam.course.title}
      </Link>
      <header className="mt-4 flex items-start gap-4">
        <CourseIcon icon={info.exam.course.icon} color={info.exam.course.color} size="lg" />
        <div>
          <p className="text-sm font-medium text-warning">Abschlussprüfung</p>
          <h1 className="text-3xl font-bold tracking-tight">{info.exam.title}</h1>
        </div>
      </header>
      {info.exam.description && <SmallMarkdown text={info.exam.description} className="mt-6" />}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InfoTile icon={FileQuestion} label="Fragen" value={String(info.exam.question_count)} />
        <InfoTile icon={Award} label="Praxis-Aufgaben" value={String(info.exam.task_count)} />
        <InfoTile icon={Clock} label="Zeitlimit" value={info.exam.time_limit_minutes ? `${info.exam.time_limit_minutes} Min.` : 'keins'} />
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-2 py-5 text-sm text-muted-foreground">
          <p>• Bestanden ab <strong className="text-foreground">{info.exam.pass_percent} %</strong>. Praxis-Aufgaben zählen doppelt.</p>
          <p>• Während der Prüfung siehst du keine Lösungen – die Auswertung kommt danach, inklusive Schwächenanalyse pro Modul.</p>
          <p>• Terminal-Aufgaben werden beim Abgeben direkt in deinem Workspace geprüft.</p>
          <p>• Du kannst die Prüfung beliebig oft wiederholen.</p>
        </CardContent>
      </Card>

      <div className="mt-6">
        {user ? (
          <Button size="lg" onClick={start} disabled={starting}>{starting ? <Spinner /> : <Award />} Prüfung starten</Button>
        ) : (
          <Button asChild size="lg"><Link to={`/anmelden?weiter=/kurse/${info.exam.course.slug}/pruefung`}>Anmelden, um die Prüfung abzulegen</Link></Button>
        )}
      </div>

      {info.attempts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="size-4" /> Bisherige Versuche</h2>
          <ul className="space-y-2">
            {info.attempts.map((attempt) => (
              <li key={attempt.id}>
                <Link to={`/pruefungen/${attempt.id}`} className="flex items-center gap-3 rounded-xl border p-3 text-sm hover:border-brand/50">
                  {attempt.passed ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
                  <span className="flex-1">{formatDateTime(attempt.finished_at)}</span>
                  <span className="tabular-nums">{attempt.score} / {attempt.max_score}</span>
                  <Badge variant={attempt.passed ? 'default' : 'outline'} className={cn(attempt.passed && 'bg-success text-white')}>{attempt.passed ? 'Bestanden' : 'Nicht bestanden'}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="size-5 text-brand" />
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function ExamRunner({ info, session }: { info: ExamInfo; session: ExamStart }) {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Answer[]>(() => session.questions.map(emptyAnswer))
  const [taskState, setTaskState] = useState<Record<string, { passed?: boolean; code?: string }>>({})
  const [index, setIndex] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)
  const total = session.questions.length + session.tasks.length
  const onTask = index >= session.questions.length
  const answeredCount = session.questions.filter((question, i) => isAnswered(question, answers[i] ?? null)).length

  const submit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    try {
      const result = await Api.submitExam(session.attempt_id, { answers, tasks: taskState })
      navigate(`/pruefungen/${result.attempt.id}`)
    } catch (error) {
      submittedRef.current = false
      toast.error(error instanceof Error ? error.message : 'Abgabe fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }, [answers, taskState, session.attempt_id, navigate])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate font-semibold">{info.exam.title}</p>
          {session.deadline && <Countdown deadline={session.deadline} onExpire={submit} />}
          <Button size="sm" onClick={() => setConfirm(true)} disabled={submitting}>
            {submitting ? <Spinner /> : <Send />} Abgeben
          </Button>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: total }, (_, i) => {
            const isQuestion = i < session.questions.length
            const done = isQuestion ? isAnswered(session.questions[i]!, answers[i] ?? null) : Boolean(taskState[session.tasks[i - session.questions.length]!.id]?.passed || taskState[session.tasks[i - session.questions.length]!.id]?.code)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${isQuestion ? 'Frage' : 'Aufgabe'} ${i + 1}`}
                className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold', i === index && 'ring-2 ring-brand', done ? 'border-brand bg-brand/15' : 'bg-card', !isQuestion && 'rounded-full')}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {onTask ? `Praxis-Aufgabe ${index - session.questions.length + 1} von ${session.tasks.length}` : `Frage ${index + 1} von ${session.questions.length}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!onTask ? (
            <QuestionView
              key={index}
              idPrefix={`exam-${session.attempt_id}-${index}`}
              question={session.questions[index]!}
              value={answers[index] ?? null}
              onChange={(value) => setAnswers((previous) => previous.map((item, i) => (i === index ? value : item)))}
            />
          ) : (
            <ExamTask
              key={index}
              task={session.tasks[index - session.questions.length]!}
              examId={info.exam.id}
              course={info.exam.course}
              onUpdate={(id, state) => setTaskState((previous) => ({ ...previous, [id]: { ...previous[id], ...state } }))}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between gap-2">
        <Button variant="outline" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}><ArrowLeft /> Zurück</Button>
        {index < total - 1 ? (
          <Button onClick={() => setIndex(index + 1)}>Weiter <ArrowRight /></Button>
        ) : (
          <Button onClick={() => setConfirm(true)}><Send /> Prüfung abgeben</Button>
        )}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prüfung abgeben?</AlertDialogTitle>
            <AlertDialogDescription>
              Du hast {answeredCount} von {session.questions.length} Fragen beantwortet. Nach der Abgabe kannst du nichts mehr ändern – du kannst die Prüfung aber jederzeit neu starten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Weiter bearbeiten</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Jetzt abgeben</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ExamTask({ task, examId, course, onUpdate }: { task: Task; examId: number; course: ExamInfo['exam']['course']; onUpdate: (id: string, state: { passed?: boolean; code?: string }) => void }) {
  const onCodeChange = useCallback((code: string) => onUpdate(task.id, { code }), [onUpdate, task.id])
  const context = useMemo(
    () => ({ scope: { scope: 'lesson' as const, id: 0 }, courseSlug: course.slug, workspaceDir: course.workspace_dir ?? course.slug, storagePrefix: `exam.${examId}` }),
    [course, examId],
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{task.title}</h3>
      <SmallMarkdown text={task.description} />
      {task.type === 'code' && (
        <CodeTask task={task} context={context} examId={examId} onAttempt={() => undefined} onSolved={() => onUpdate(task.id, { passed: true })} onCodeChange={task.language === 'php' ? onCodeChange : undefined} />
      )}
      {task.type === 'terminal' && (
        <>
          <p className="rounded-lg bg-muted/50 p-3 text-sm">
            Arbeite im Ordner <code className="font-mono">workspace/{context.workspaceDir}/{task.workdir}</code>. Geprüft wird beim Abgeben.
          </p>
          <RealTerminal courseSlug={course.slug} startDir={task.workdir} label={`${context.workspaceDir}/${task.workdir}`} />
        </>
      )}
    </div>
  )
}

function Countdown({ deadline, onExpire }: { deadline: string; onExpire: () => void }) {
  const end = useMemo(() => new Date(deadline).getTime(), [deadline])
  const [now, setNow] = useState(Date.now())
  const remaining = Math.max(0, end - now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (remaining === 0) onExpire()
  }, [remaining, onExpire])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-sm tabular-nums', remaining < 60_000 ? 'bg-destructive/15 text-destructive' : 'bg-muted')}>
      <AlarmClock className="size-4" /> {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  )
}


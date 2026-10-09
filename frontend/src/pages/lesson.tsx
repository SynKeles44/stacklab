import { ArrowLeft, ArrowRight, BookA, CheckCircle2, Clock, ExternalLink, ListChecks, NotebookPen } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { toast } from 'sonner'
import { BookmarkButton } from '@/components/common/bookmark-button'
import { CourseIcon } from '@/components/common/course-icon'
import { LessonMarkdown, slugifyHeading } from '@/components/markdown/lesson-markdown'
import { LessonQuiz } from '@/components/quiz/lesson-quiz'
import { TaskRenderer } from '@/components/tasks/task-renderer'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Api, type LessonResponse } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { celebrateBig, celebrateSmall, originFromElement } from '@/lib/celebrate'
import { markKnown } from '@/lib/unlocks'
import { cn } from '@/lib/utils'

export function LessonPage() {
  const data = useLoaderData() as LessonResponse
  return <LessonView key={data.lesson.id} data={data} />
}

function LessonView({ data }: { data: LessonResponse }) {
  const { lesson, state } = data
  const user = useSession()
  const [completed, setCompleted] = useState(state?.completed ?? false)
  const [completedTasks, setCompletedTasks] = useState<string[]>(state?.completed_tasks ?? [])
  const [busy, setBusy] = useState(false)
  const completeRef = useRef<HTMLButtonElement>(null)

  const headings = useMemo(
    () =>
      [...lesson.body.matchAll(/^##\s+(.+)$/gm)].map((match) => {
        const text = match[1]!.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug: string, label?: string) => label ?? slug).replace(/[`*_]/g, '')
        return { text, id: slugifyHeading(text) }
      }),
    [lesson.body],
  )

  useEffect(() => {
    markKnown(state?.unlocked_terms ?? [])
    if (user) void Api.visitLesson(lesson.id).catch(() => undefined)
    document.title = `${lesson.title} · ${lesson.course.title} · Stacklab`
  }, [lesson.id, lesson.title, lesson.course.title, state?.unlocked_terms, user])

  const complete = async () => {
    if (!user) {
      toast.info('Melde dich an, damit dein Fortschritt gespeichert wird.')
      return
    }
    setBusy(true)
    try {
      const result = await Api.completeLesson(lesson.id)
      setCompleted(true)
      if (result.course_completed && result.newly_completed) {
        celebrateBig()
        toast.success('Kurs abgeschlossen! 🎓', { description: `Du hast alle Lektionen von „${lesson.course.title}“ geschafft. Zeit für die Prüfung!` })
      } else if (result.newly_completed) {
        celebrateSmall(originFromElement(completeRef.current))
        toast.success('Lektion abgeschlossen', { description: result.course_progress ? `Kursfortschritt: ${result.course_progress.percent} %` : undefined })
      }
    } finally {
      setBusy(false)
    }
  }

  const taskContext = {
    scope: { scope: 'lesson' as const, id: lesson.id },
    courseSlug: lesson.course.slug,
    workspaceDir: lesson.course.workspace_dir ?? lesson.course.slug,
    storagePrefix: `${lesson.course.slug}.${lesson.slug}`,
  }

  const lessonUrl = `/kurse/${lesson.course.slug}/${lesson.slug}`

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="mx-auto w-full max-w-3xl min-w-0">
          <Breadcrumb className="mb-5">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/kurse">Kurse</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/kurse/${lesson.course.slug}`}>{lesson.course.title}</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="hidden sm:inline-flex"><BreadcrumbPage>{lesson.module.title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <header className="mb-8">
            <div className="flex items-start gap-4">
              <CourseIcon icon={lesson.course.icon} color={lesson.course.color} className="hidden sm:inline-flex" />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Lektion {lesson.position} von {lesson.total}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {lesson.duration_minutes} Min.</span>
                  {completed && <Badge className="gap-1 bg-success text-white"><CheckCircle2 className="size-3" /> Abgeschlossen</Badge>}
                </div>
                <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                  {lesson.title}
                </motion.h1>
                {lesson.summary && <p className="mt-3 text-lg text-muted-foreground">{lesson.summary}</p>}
              </div>
              <BookmarkButton type="lesson" refKey={`${lesson.course.slug}/${lesson.slug}`} label={lesson.title} url={lessonUrl} />
            </div>
            <Progress value={lesson.position && lesson.total ? (lesson.position / lesson.total) * 100 : 0} className="mt-6 h-1" />
          </header>

          <LessonMarkdown body={lesson.body} terms={lesson.terms} />

          {lesson.terms.length > 0 && (
            <section className="mt-12 rounded-2xl border bg-muted/30 p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><BookA className="size-5 text-brand" /> Begriffe aus dieser Lektion</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {lesson.terms.map((term) => (
                  <Link key={term.slug} to={`/lexikon/${term.slug}`} className="rounded-full border bg-background px-3 py-1 text-sm transition-colors hover:border-brand hover:text-brand">
                    {term.term}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {lesson.tasks.length > 0 && (
            <section className="mt-12 space-y-5" id="aufgaben">
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <ListChecks className="size-6 text-brand" /> Jetzt bist du dran
                <span className="ml-auto text-sm font-normal text-muted-foreground">{completedTasks.length} / {lesson.tasks.length} gelöst</span>
              </h2>
              {lesson.tasks.map((task) => (
                <TaskRenderer
                  key={task.id}
                  task={task}
                  context={taskContext}
                  done={completedTasks.includes(task.id)}
                  onCompleted={(id) => setCompletedTasks((previous) => (previous.includes(id) ? previous : [...previous, id]))}
                />
              ))}
            </section>
          )}

          {lesson.quiz.length > 0 && (
            <section className="mt-12" id="quiz">
              <LessonQuiz lessonId={lesson.id} questions={lesson.quiz} best={state?.best_quiz ?? null} />
            </section>
          )}

          {user && <NoteEditor lessonId={lesson.id} initial={state?.note ?? ''} />}

          {lesson.sources.length > 0 && (
            <section className="mt-10 text-sm text-muted-foreground">
              <h2 className="mb-2 font-semibold text-foreground">Quellen & Weiterlesen</h2>
              <ul className="space-y-1">
                {lesson.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-foreground hover:underline">
                      {source.title} <ExternalLink className="size-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Card className={cn('mt-12', completed && 'border-success/40 bg-success/5')}>
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:text-left">
              <div className="flex-1">
                <p className="font-semibold">{completed ? 'Diese Lektion hast du abgeschlossen.' : 'Alles verstanden?'}</p>
                <p className="text-sm text-muted-foreground">
                  {completed
                    ? 'Du kannst sie jederzeit wieder als Nachschlagewerk nutzen.'
                    : completedTasks.length < lesson.tasks.length
                      ? 'Tipp: Löse zuerst die Aufgaben – erst durch Tun bleibt Wissen hängen.'
                      : 'Super, alle Aufgaben gelöst. Schließe die Lektion ab.'}
                </p>
              </div>
              {!completed && (
                <Button ref={completeRef} size="lg" onClick={complete} disabled={busy}>
                  {busy ? <Spinner /> : <CheckCircle2 />} Lektion abschließen
                </Button>
              )}
            </CardContent>
          </Card>

          <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Lektionsnavigation">
            {lesson.previous ? (
              <Link to={`/kurse/${lesson.course.slug}/${lesson.previous.slug}`} className="group rounded-xl border p-4 transition-colors hover:border-brand">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" /> Vorherige Lektion</span>
                <span className="mt-1 block font-medium group-hover:text-brand">{lesson.previous.title}</span>
              </Link>
            ) : <span />}
            {lesson.next ? (
              <Link to={`/kurse/${lesson.course.slug}/${lesson.next.slug}`} className="group rounded-xl border p-4 text-right transition-colors hover:border-brand">
                <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Nächste Lektion <ArrowRight className="size-3.5" /></span>
                <span className="mt-1 block font-medium group-hover:text-brand">{lesson.next.title}</span>
              </Link>
            ) : (
              <Link to={`/kurse/${lesson.course.slug}`} className="group rounded-xl border p-4 text-right transition-colors hover:border-brand">
                <span className="text-xs text-muted-foreground">Ende des Kurses</span>
                <span className="mt-1 block font-medium group-hover:text-brand">Zur Kursübersicht, Projekt & Prüfung</span>
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-6 text-sm">
            {headings.length > 0 && (
              <div>
                <p className="mb-2 font-semibold">Auf dieser Seite</p>
                <ul className="space-y-1.5 border-l">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted-foreground hover:border-brand hover:text-foreground">{heading.text}</a>
                    </li>
                  ))}
                  {lesson.tasks.length > 0 && <li><a href="#aufgaben" className="-ml-px block border-l border-transparent pl-3 text-muted-foreground hover:border-brand hover:text-foreground">Aufgaben</a></li>}
                  {lesson.quiz.length > 0 && <li><a href="#quiz" className="-ml-px block border-l border-transparent pl-3 text-muted-foreground hover:border-brand hover:text-foreground">Quiz</a></li>}
                </ul>
              </div>
            )}
            <div className="rounded-xl border p-3">
              <p className="font-medium">{lesson.module.title}</p>
              <p className="mt-1 text-muted-foreground">Modul im Kurs {lesson.course.title}</p>
              <Button asChild variant="link" className="mt-1 h-auto p-0"><Link to={`/kurse/${lesson.course.slug}`}>Alle Lektionen</Link></Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function NoteEditor({ lessonId, initial }: { lessonId: number; initial: string }) {
  const [value, setValue] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setStatus('saving')
    const timer = window.setTimeout(async () => {
      await Api.saveNote(lessonId, value).catch(() => undefined)
      setStatus('saved')
    }, 700)
    return () => window.clearTimeout(timer)
  }, [value, lessonId])

  return (
    <section className="mt-12">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><NotebookPen className="size-5 text-brand" /> Deine Notizen</h2>
        <span className="text-xs text-muted-foreground">{status === 'saving' ? 'Speichert …' : status === 'saved' ? 'Gespeichert' : 'Nur für dich sichtbar'}</span>
      </div>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Was willst du dir merken? Eigene Beispiele, offene Fragen …" className="min-h-28" />
    </section>
  )
}

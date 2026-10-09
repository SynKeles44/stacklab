import { ArrowLeft, ArrowRight, BookA, CheckCircle2, Clock, ExternalLink, ListTree, NotebookPen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { BookmarkButton } from '@/components/common/bookmark-button'
import { CourseIcon } from '@/components/common/course-icon'
import { CourseOutline } from '@/components/common/course-outline'
import { LessonMarkdown } from '@/components/markdown/lesson-markdown'
import { LessonQuiz } from '@/components/quiz/lesson-quiz'
import { TaskRenderer } from '@/components/tasks/task-renderer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Kbd } from '@/components/ui/kbd'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Api, type CourseDetail, type LessonResponse } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { celebrateBig } from '@/lib/celebrate'
import { buildPages, type LessonPage as Page } from '@/lib/lesson-pages'
import { useUiVariant } from '@/lib/ui-variant'
import { markKnown } from '@/lib/unlocks'
import { cn } from '@/lib/utils'

type LessonData = LessonResponse & { outline: CourseDetail }

export function LessonPage() {
  const data = useLoaderData() as LessonData
  return <LessonView key={data.lesson.id} data={data} />
}

function LessonView({ data }: { data: LessonData }) {
  const { lesson, state } = data
  const user = useSession()
  const apple = useUiVariant() === 'apple'
  const [params, setParams] = useSearchParams()
  const [completed, setCompleted] = useState(state?.completed ?? false)
  const [completedTasks, setCompletedTasks] = useState<string[]>(state?.completed_tasks ?? [])
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [animated, setAnimated] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => buildPages(lesson.body, lesson.tasks.map((task) => task.title), lesson.quiz.length > 0), [lesson])
  const requested = Number(params.get('seite') ?? '1')
  const index = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), pages.length) - 1 : 0
  const page = pages[index]!

  const goTo = useCallback(
    (next: number, viaKeyboard = false) => {
      if (next < 0 || next >= pages.length || next === index) return
      setAnimated(!viaKeyboard)
      setParams(next === 0 ? {} : { seite: String(next + 1) }, { replace: true, preventScrollReset: true })
      topRef.current?.scrollIntoView({ block: 'start' })
    },
    [index, pages.length, setParams],
  )

  useEffect(() => {
    markKnown(state?.unlocked_terms ?? [])
    if (user) void Api.visitLesson(lesson.id).catch(() => undefined)
    document.title = `${lesson.title} · ${lesson.course.title} · Stacklab`
  }, [lesson.id, lesson.title, lesson.course.title, state?.unlocked_terms, user])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"], .cm-editor, .xterm, [role="dialog"]')) return
      if (event.key === 'ArrowRight') goTo(index + 1, true)
      if (event.key === 'ArrowLeft') goTo(index - 1, true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index])

  const taskContext = {
    scope: { scope: 'lesson' as const, id: lesson.id },
    courseSlug: lesson.course.slug,
    workspaceDir: lesson.course.workspace_dir ?? lesson.course.slug,
    storagePrefix: `${lesson.course.slug}.${lesson.slug}`,
    url: `/kurse/${lesson.course.slug}/${lesson.slug}`,
  }

  const isDone = (candidate: Page) =>
    (candidate.kind === 'task' && completedTasks.includes(lesson.tasks[candidate.taskIndex]!.id)) || (candidate.kind === 'finish' && completed)

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <div ref={topRef} className="scroll-mt-20" />

      <div className="mb-4 flex items-center gap-2">
        <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm"><ListTree /> Kursinhalt</Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader><SheetTitle>{lesson.course.title}</SheetTitle></SheetHeader>
            <ScrollArea className="h-[calc(100svh-5rem)] px-4 pb-6">
              <CourseOutline course={data.outline} activeSlug={lesson.slug} onNavigate={() => setOutlineOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Link to={`/kurse/${lesson.course.slug}`} className="min-w-0 truncate text-sm text-muted-foreground hover:text-foreground">
          {lesson.course.title} · {lesson.module.title}
        </Link>
        <div className="ml-auto">
          <BookmarkButton type="lesson" refKey={`${lesson.course.slug}/${lesson.slug}`} label={lesson.title} url={taskContext.url} size="icon-sm" />
        </div>
      </div>

      <header className="flex items-start gap-3">
        <CourseIcon icon={lesson.course.icon} color={lesson.course.color} size="sm" className="mt-1" />
        <div className="min-w-0 flex-1">
          <h1 className={cn('font-bold tracking-tight text-balance', index === 0 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl')}>{lesson.title}</h1>
          {index === 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>Lektion {lesson.position} von {lesson.total}</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {lesson.duration_minutes} Min.</span>
              {completed && <Badge className="gap-1 bg-success text-white"><CheckCircle2 className="size-3" /> Abgeschlossen</Badge>}
            </div>
          )}
        </div>
      </header>

      <PageBar pages={pages} index={index} onSelect={goTo} isDone={isDone} />

      <div className="min-h-[45svh]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={index}
            initial={animated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={animated ? { opacity: 0, transition: { duration: 0.08 } } : undefined}
            transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
            aria-label={`Seite ${index + 1} von ${pages.length}: ${page.title}`}
          >
            {page.kind === 'text' && <LessonMarkdown body={page.markdown} terms={lesson.terms} />}

            {page.kind === 'task' && (
              <TaskRenderer
                task={lesson.tasks[page.taskIndex]!}
                context={taskContext}
                done={completedTasks.includes(lesson.tasks[page.taskIndex]!.id)}
                onCompleted={(id) => setCompletedTasks((previous) => (previous.includes(id) ? previous : [...previous, id]))}
              />
            )}

            {page.kind === 'quiz' && <LessonQuiz lessonId={lesson.id} questions={lesson.quiz} best={state?.best_quiz ?? null} />}

            {page.kind === 'finish' && <FinishPage data={data} completed={completed} completedTasks={completedTasks.length} onCompleted={() => setCompleted(true)} />}
          </motion.section>
        </AnimatePresence>
      </div>

      <nav
        className={cn(
          'sticky z-20 -mx-4 mt-8 flex items-center gap-2 px-4 py-3 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:shadow-none sm:backdrop-blur-none',
          apple ? 'material bottom-[calc(3.5rem+env(safe-area-inset-bottom))] shadow-[0_-0.5px_0_var(--border)] md:bottom-0' : 'bottom-0 border-t bg-background/90 backdrop-blur sm:border-0',
        )}
        aria-label="Blättern"
      >
        <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Vorherige Seite">
          <ArrowLeft /> <span className="hidden sm:inline">Zurück</span>
        </Button>
        <span className="flex-1 text-center text-sm text-muted-foreground tabular-nums">
          {index + 1} / {pages.length}
          <span className="ml-3 hidden gap-1 md:inline-flex"><Kbd>←</Kbd><Kbd>→</Kbd></span>
        </span>
        {index < pages.length - 1 ? (
          <Button onClick={() => goTo(index + 1)}>
            {nextLabel(pages[index + 1]!)} <ArrowRight />
          </Button>
        ) : lesson.next ? (
          <Button asChild>
            <Link to={`/kurse/${lesson.course.slug}/${lesson.next.slug}`}>Nächste Lektion <ArrowRight /></Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link to={`/kurse/${lesson.course.slug}`}>Zur Kursübersicht <ArrowRight /></Link>
          </Button>
        )}
      </nav>
    </div>
  )
}

function nextLabel(page: Page): string {
  if (page.kind === 'task') return 'Zur Aufgabe'
  if (page.kind === 'quiz') return 'Zum Quiz'
  if (page.kind === 'finish') return 'Abschluss'
  return 'Weiter'
}

function PageBar({ pages, index, onSelect, isDone }: { pages: Page[]; index: number; onSelect: (index: number) => void; isDone: (page: Page) => boolean }) {
  const current = pages[index]!
  const prefix = current.kind === 'task' ? 'Aufgabe · ' : current.kind === 'text' ? '' : ''
  return (
    <div className="my-5">
      <div className="flex gap-1" role="tablist" aria-label="Seiten der Lektion">
        {pages.map((page, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button type="button" role="tab" aria-selected={i === index} aria-label={`Seite ${i + 1}: ${page.title}`} onClick={() => onSelect(i)} className="group flex h-6 flex-1 items-center">
                <span
                  className={cn(
                    'h-1.5 w-full rounded-full transition-colors',
                    i < index ? 'bg-brand/60' : i === index ? 'bg-brand' : page.kind === 'text' ? 'bg-muted group-hover:bg-muted-foreground/30' : 'bg-brand-2/25 group-hover:bg-brand-2/40',
                    isDone(page) && 'bg-success',
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>{page.kind === 'task' ? `Aufgabe: ${page.title}` : page.title}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{prefix}{current.title}</p>
    </div>
  )
}

function FinishPage({ data, completed, completedTasks, onCompleted }: { data: LessonData; completed: boolean; completedTasks: number; onCompleted: () => void }) {
  const { lesson, state } = data
  const user = useSession()
  const [busy, setBusy] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const complete = async () => {
    if (!user) {
      toast.info('Melde dich an, damit dein Fortschritt gespeichert wird.')
      return
    }
    setBusy(true)
    try {
      const result = await Api.completeLesson(lesson.id)
      onCompleted()
      if (result.course_completed && result.newly_completed) {
        celebrateBig()
        toast.success('Kurs abgeschlossen!', { description: `Du hast alle Lektionen von „${lesson.course.title}“ geschafft. Zeit für die Prüfung!` })
      } else if (result.newly_completed) {
        toast.success('Lektion abgeschlossen', { description: result.course_progress ? `Kursfortschritt: ${result.course_progress.percent} %` : undefined })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className={cn(completed && 'border-success/40 bg-success/5')}>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <p className="font-semibold">{completed ? 'Diese Lektion hast du abgeschlossen.' : 'Alles verstanden?'}</p>
            <p className="text-sm text-muted-foreground">
              {completed
                ? 'Du kannst sie jederzeit wieder als Nachschlagewerk nutzen.'
                : completedTasks < lesson.tasks.length
                  ? `Du hast ${completedTasks} von ${lesson.tasks.length} Aufgaben gelöst. Erst durch Tun bleibt Wissen hängen.`
                  : 'Super, alle Aufgaben gelöst. Schließe die Lektion ab.'}
            </p>
          </div>
          {!completed && (
            <Button ref={buttonRef} size="lg" onClick={complete} disabled={busy}>
              {busy ? <Spinner /> : <CheckCircle2 />} Lektion abschließen
            </Button>
          )}
        </CardContent>
      </Card>

      {lesson.terms.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><BookA className="size-4 text-brand" /> Begriffe aus dieser Lektion</h2>
          <div className="flex flex-wrap gap-2">
            {lesson.terms.map((term) => (
              <Link key={term.slug} to={`/lexikon/${term.slug}`} className="rounded-full border bg-background px-3 py-1 text-sm transition-colors hover:border-brand hover:text-brand">
                {term.term}
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && <NoteEditor lessonId={lesson.id} initial={state?.note ?? ''} />}

      {lesson.sources.length > 0 && (
        <section className="text-sm text-muted-foreground">
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

      {lesson.previous && (
        <Link to={`/kurse/${lesson.course.slug}/${lesson.previous.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Vorherige Lektion: {lesson.previous.title}
        </Link>
      )}
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
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold"><NotebookPen className="size-4 text-brand" /> Deine Notizen</h2>
        <span className="text-xs text-muted-foreground">{status === 'saving' ? 'Speichert …' : status === 'saved' ? 'Gespeichert' : 'Nur für dich sichtbar'}</span>
      </div>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Was willst du dir merken? Eigene Beispiele, offene Fragen …" className="min-h-28" />
    </section>
  )
}

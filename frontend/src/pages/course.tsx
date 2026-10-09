import { ArrowRight, Award, BookOpen, CheckCircle2, Circle, Clock, Dumbbell, FolderGit2, Hammer, Layers, Target, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import { Link, useLoaderData } from 'react-router'
import { BookmarkButton } from '@/components/common/bookmark-button'
import { CourseIcon } from '@/components/common/course-icon'
import { TaskRenderer } from '@/components/tasks/task-renderer'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { CourseDetail, CourseModule } from '@/lib/api'
import { useUiVariant } from '@/lib/ui-variant'
import { CATEGORY_LABELS, LEVEL_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'

export function CoursePage() {
  const course = useLoaderData() as CourseDetail
  const apple = useUiVariant() === 'apple'
  const lessons = course.modules.flatMap((module) => module.lessons)
  const completed = lessons.filter((lesson) => lesson.completed).length
  const percent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0
  const firstLesson = lessons[0]
  const target = course.next_lesson ?? (completed === 0 ? firstLesson : null)

  useEffect(() => {
    document.title = `${course.title} · Stacklab`
  }, [course.title])

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Kurs {course.position} · {CATEGORY_LABELS[course.category] ?? course.category} · {LEVEL_LABELS[course.level] ?? course.level}
            </p>
            <div className="mt-3 flex items-start gap-4">
              <CourseIcon icon={course.icon} color={course.color} />
              <div className="min-w-0">
                <h1 className={cn('tracking-tight', apple ? 'text-4xl font-bold sm:text-5xl' : 'text-3xl font-semibold sm:text-4xl')}>{course.title}</h1>
                {course.subtitle && <p className="mt-2 text-lg text-muted-foreground">{course.subtitle}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Layers className="size-4" /> {course.modules.length} Module</span>
              <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" /> {lessons.length} Lektionen</span>
              {course.estimated_hours > 0 && <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> ca. {course.estimated_hours} Stunden</span>}
              {course.project && <span className="inline-flex items-center gap-1.5"><Hammer className="size-4" /> Projekt</span>}
              {course.exam && <span className="inline-flex items-center gap-1.5"><Award className="size-4" /> Prüfung</span>}
            </div>
          </div>
          <div className="w-full space-y-3 rounded-xl bg-card p-4 shadow-card lg:w-72">
            <div className="flex items-center justify-between text-sm">
              <span>Fortschritt</span>
              <span className="text-muted-foreground tabular-nums">{completed} / {lessons.length}</span>
            </div>
            <Progress value={percent} className="h-1.5" />
            <div className="flex gap-2">
              {target ? (
                <Button asChild className="flex-1">
                  <Link to={`/kurse/${course.slug}/${target.slug}`}>{completed === 0 ? 'Kurs starten' : 'Weiterlernen'} <ArrowRight /></Link>
                </Button>
              ) : (
                <Button asChild className="flex-1" variant={course.exam ? 'default' : 'secondary'}>
                  <Link to={course.exam ? `/kurse/${course.slug}/pruefung` : `/kurse/${course.slug}/${firstLesson?.slug ?? ''}`}>
                    {course.exam ? 'Zur Prüfung' : 'Wiederholen'} <ArrowRight />
                  </Link>
                </Button>
              )}
              <BookmarkButton type="course" refKey={course.slug} label={course.title} url={`/kurse/${course.slug}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <section className="lesson-prose">
            <Markdown>{course.description}</Markdown>
          </section>

          {course.learning_goals.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><Target className="size-5 text-brand" /> Das kannst du danach</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.learning_goals.map((goal) => (
                  <li key={goal} className="flex gap-2 rounded-xl border bg-card p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {goal}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-xl font-semibold">Inhalt</h2>
            <Accordion type="multiple" className="space-y-3">
              {course.modules.map((module, index) => (
                <ModuleItem key={module.id} course={course} module={module} index={index} />
              ))}
            </Accordion>
          </section>
        </div>

        <aside className="space-y-4">
          {course.project && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FolderGit2 className="size-5 text-brand" /> Begleitetes Projekt</CardTitle>
                <CardDescription>{course.project.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="line-clamp-4 text-muted-foreground">{course.project.description}</p>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/kurse/${course.slug}/projekt`}>{course.project.step_count} Schritte ansehen <ArrowRight /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {course.exam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="size-5 text-warning" /> Abschlussprüfung</CardTitle>
                <CardDescription>
                  {course.exam.question_count} Aufgaben{course.exam.time_limit_minutes ? ` · ${course.exam.time_limit_minutes} Minuten` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/kurse/${course.slug}/pruefung`}>Zur Prüfung <ArrowRight /></Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {course.prerequisites.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Vorher hilfreich</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {course.prerequisites.map((item) => (
                  <Link key={item.slug} to={`/kurse/${item.slug}`} className="rounded-full border px-3 py-1 text-sm hover:border-brand hover:text-brand">{item.title}</Link>
                ))}
              </CardContent>
            </Card>
          )}
          {course.references.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wrench className="size-4" /> Aus der Praxis</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
                  {course.references.map((reference) => <li key={reference}>{reference}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
          {course.workspace_dir && (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Alles, was du in diesem Kurs im Übungs-Terminal baust, liegt auf deinem Rechner unter <code className="font-mono text-foreground">workspace/{course.workspace_dir}/</code>.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function ModuleItem({ course, module, index }: { course: CourseDetail; module: CourseModule; index: number }) {
  const [exerciseOpen, setExerciseOpen] = useState(false)
  const done = module.lessons.filter((lesson) => lesson.completed).length
  const allDone = module.lessons.length > 0 && done === module.lessons.length

  return (
    <AccordionItem value={module.slug} className="overflow-hidden rounded-xl border-0 bg-card px-0 shadow-card">
      <div className="flex items-center pr-2">
        <AccordionTrigger className="items-center gap-3 rounded-none py-4 pr-2 pl-5">
          <div className="flex min-w-0 flex-1 items-center gap-4 text-left">
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums', allDone && 'bg-success text-white')}>
              {allDone ? <CheckCircle2 className="size-5" /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{module.title}</p>
              <p className="text-sm font-normal text-muted-foreground">{done} / {module.lessons.length} Lektionen{module.exercise ? ' · mit Modul-Übung' : ''}</p>
            </div>
          </div>
        </AccordionTrigger>
        <BookmarkButton type="module" refKey={`${course.slug}/${module.slug}`} label={`${course.title}: ${module.title}`} url={`/kurse/${course.slug}`} size="icon-sm" />
      </div>
      <AccordionContent className="pb-2">
        {module.description && <p className="px-5 pb-3 text-sm text-muted-foreground">{module.description}</p>}
        <ol className="border-t">
          {module.lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/kurse/${course.slug}/${lesson.slug}`} className="group flex items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-muted/60">
                {lesson.completed ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <Circle className="size-5 shrink-0 text-muted-foreground/40" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  {lesson.summary && <p className="line-clamp-1 text-sm text-muted-foreground">{lesson.summary}</p>}
                </div>
                <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">{lesson.duration_minutes} Min.</span>
              </Link>
            </li>
          ))}
        </ol>
        {module.exercise && (
          <button
            type="button"
            onClick={() => setExerciseOpen(true)}
            className={cn('flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/60', module.exercise_done && 'bg-success/5')}
          >
            <Dumbbell className={cn('size-5 shrink-0', module.exercise_done ? 'text-success' : 'text-brand')} />
            <div className="flex-1">
              <p className="font-medium">Modul-Übung: {module.exercise.title}</p>
              <p className="text-sm text-muted-foreground">Größere Übung, die alles aus diesem Modul kombiniert.</p>
            </div>
            {module.exercise_done && <Badge className="bg-success text-white">Gelöst</Badge>}
          </button>
        )}
        {module.exercise && (
          <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Modul-Übung · {module.title}</DialogTitle>
              </DialogHeader>
              <TaskRenderer
                task={module.exercise}
                done={module.exercise_done}
                context={{ scope: { scope: 'module', id: module.id }, courseSlug: course.slug, workspaceDir: course.workspace_dir ?? course.slug, storagePrefix: `${course.slug}.modul.${module.slug}` }}
              />
            </DialogContent>
          </Dialog>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

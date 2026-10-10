import { ArrowRight, Award, BookOpen, CheckCircle2, ChevronRight, Circle, Clock, Dumbbell, FolderGit2, Hammer, Layers, type LucideIcon, Target, Wrench } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
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
      {apple ? (
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
      ) : (
        <section style={{ '--course': course.color ?? 'var(--brand)' } as CSSProperties} className="course-wash border-b">
          <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-14">
            <nav aria-label="Brotkrumen" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/kurse" className="hover:text-foreground">Kurse</Link>
              <ChevronRight className="size-3.5" />
              <span>{CATEGORY_LABELS[course.category] ?? course.category}</span>
            </nav>
            <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-3xl">
                <CourseIcon icon={course.icon} color={course.color} size="lg" />
                <p className="eyebrow mt-6">Kurs {String(course.position).padStart(2, '0')} · {LEVEL_LABELS[course.level] ?? course.level}</p>
                <h1 className="page-title mt-3 sm:text-[2.875rem]">{course.title}</h1>
                {course.subtitle && <p className="lead mt-3">{course.subtitle}</p>}
                <ul className="mt-6 flex flex-wrap gap-2 text-sm">
                  <MetaChip icon={Layers}>{course.modules.length} Module</MetaChip>
                  <MetaChip icon={BookOpen}>{lessons.length} Lektionen</MetaChip>
                  {course.estimated_hours > 0 && <MetaChip icon={Clock}>ca. {course.estimated_hours} Stunden</MetaChip>}
                  {course.project && <MetaChip icon={Hammer}>Projekt</MetaChip>}
                  {course.exam && <MetaChip icon={Award}>Prüfung & Zertifikat</MetaChip>}
                </ul>
              </div>
              <div className="w-full shrink-0 rounded-xl bg-card p-5 shadow-raised lg:w-80">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{completed === 0 ? 'Noch nicht begonnen' : completed === lessons.length ? 'Alle Lektionen geschafft' : 'Dein Fortschritt'}</p>
                  <span className="numeric text-sm text-muted-foreground">{completed}/{lessons.length}</span>
                </div>
                <Progress value={percent} className="mt-3 h-1.5" />
                <div className="mt-4 flex gap-2">
                  {target ? (
                    <Button asChild size="lg" className="h-10 flex-1">
                      <Link to={`/kurse/${course.slug}/${target.slug}`}>{completed === 0 ? 'Kurs starten' : 'Weiterlernen'} <ArrowRight /></Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="h-10 flex-1" variant={course.exam ? 'default' : 'secondary'}>
                      <Link to={course.exam ? `/kurse/${course.slug}/pruefung` : `/kurse/${course.slug}/${firstLesson?.slug ?? ''}`}>
                        {course.exam ? 'Zur Prüfung' : 'Wiederholen'} <ArrowRight />
                      </Link>
                    </Button>
                  )}
                  <BookmarkButton type="course" refKey={course.slug} label={course.title} url={`/kurse/${course.slug}`} size="icon-lg" className="size-10 bg-secondary hover:bg-secondary/80" />
                </div>
                {target && completed > 0 && <p className="mt-3 truncate text-xs text-muted-foreground">Als Nächstes: {target.title}</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className={cn('mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]', apple ? 'py-8' : 'py-10 sm:py-14 lg:gap-14')}>
        <div className={cn('min-w-0', apple ? 'space-y-10' : 'space-y-14')}>
          <section className="lesson-prose">
            <Markdown>{course.description}</Markdown>
          </section>

          {course.learning_goals.length > 0 && (
            <section>
              <h2 className={cn('mb-4 flex items-center gap-2 text-xl font-semibold', !apple && 'tracking-[-0.015em]')}><Target className="size-5 text-brand" /> Das kannst du danach</h2>
              <ul className={cn(apple ? 'grouped [--grouped-inset:2.75rem]' : 'grid gap-2 sm:grid-cols-2')}>
                {course.learning_goals.map((goal) => (
                  <li key={goal} className={cn('flex gap-2 text-sm', apple ? 'gap-3 px-4 py-3 text-[0.9375rem]' : 'rounded-xl bg-card p-3.5 leading-relaxed shadow-card')}>
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {goal}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className={cn('text-xl font-semibold', !apple && 'tracking-[-0.015em]')}>Inhalt</h2>
              {!apple && <span className="numeric text-sm text-muted-foreground">{course.modules.length} Module · {lessons.length} Lektionen</span>}
            </div>
            <Accordion type="multiple" className="space-y-3">
              {course.modules.map((module, index) => (
                <ModuleItem key={module.id} course={course} module={module} index={index} />
              ))}
            </Accordion>
          </section>
        </div>

        <aside className="space-y-4">
          {course.project && (apple ? (
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
          ) : (
            <Link
              to={`/kurse/${course.slug}/projekt`}
              style={{ '--course': course.color ?? 'var(--brand)' } as CSSProperties}
              className="pressable course-wash group block rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-raised"
            >
              <p className="eyebrow flex items-center gap-2"><FolderGit2 className="size-3.5" /> Was du baust</p>
              <p className="mt-3 font-semibold leading-snug">{course.project.title}</p>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{firstParagraph(course.project.description)}</p>
              <div className="mt-4 flex items-center gap-1" aria-hidden>
                {Array.from({ length: course.project.step_count }, (_, index) => (
                  <span key={index} className="h-1 flex-1 rounded-full bg-foreground/12" />
                ))}
              </div>
              <p className="mt-3 flex items-center justify-between text-sm font-medium">
                {course.project.step_count} geprüfte Schritte
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
          {course.exam && (apple ? (
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
          ) : (
            <Link to={`/kurse/${course.slug}/pruefung`} className="pressable group flex items-center gap-4 rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-raised">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
                <span aria-hidden className="absolute inset-1 rounded-full border border-dashed border-warning/50" />
                <Award className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Prüfung & Zertifikat</span>
                <span className="block text-sm text-muted-foreground">
                  {course.exam.question_count} Aufgaben{course.exam.time_limit_minutes ? ` · ${course.exam.time_limit_minutes} Min.` : ''}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ))}
          {course.prerequisites.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Vorher hilfreich</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {course.prerequisites.map((item) => (
                  <Link key={item.slug} to={`/kurse/${item.slug}`} className={cn('rounded-full px-3 py-1 text-sm', apple ? 'bg-[var(--fill)] text-primary transition-colors hover:bg-[var(--fill-strong)]' : 'bg-secondary transition-colors hover:bg-accent hover:text-accent-foreground')}>{item.title}</Link>
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
            <p className={cn('text-sm text-muted-foreground', apple ? 'px-4 text-[0.8125rem]' : 'rounded-xl bg-surface p-4 leading-relaxed')}>
              Alles, was du in diesem Kurs im Übungs-Terminal baust, liegt auf deinem Rechner unter <code className="font-mono text-foreground">workspace/{course.workspace_dir}/</code>.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function ModuleItem({ course, module, index }: { course: CourseDetail; module: CourseModule; index: number }) {
  const apple = useUiVariant() === 'apple'
  const [exerciseOpen, setExerciseOpen] = useState(false)
  const done = module.lessons.filter((lesson) => lesson.completed).length
  const allDone = module.lessons.length > 0 && done === module.lessons.length

  return (
    <AccordionItem value={module.slug} className="overflow-hidden rounded-xl border-0 bg-card px-0 shadow-card">
      <div className="flex items-center pr-2">
        <AccordionTrigger className={cn('items-center gap-3 rounded-none py-4 pr-2 pl-5', apple && 'min-w-0 hover:no-underline')}>
          <div className="flex min-w-0 flex-1 items-center gap-4 text-left">
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums', !apple && 'font-mono text-xs', allDone && 'bg-success text-white')}>
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

function MetaChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 text-muted-foreground shadow-card">
      <Icon className="size-3.5" /> {children}
    </li>
  )
}

function firstParagraph(text: string): string {
  return text.split(/\n\s*\n/)[0]!.replace(/\s+/g, ' ').replace(/[`*]/g, '').trim()
}

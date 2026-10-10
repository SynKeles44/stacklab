import { Clock, MousePointer2, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CourseIcon } from '@/components/common/course-icon'
import { LessonMarkdown } from '@/components/markdown/lesson-markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { Api, type CourseSummary, type Lesson } from '@/lib/api'
import { formatCount, loadGlossary } from '@/lib/glossary-cache'
import { useInView } from '@/lib/use-in-view'

const PREFERRED_COURSE = 'git'

function excerpt(body: string): string {
  const sections = body.split(/\n(?=## )/)
  return sections.slice(0, 2).join('\n').trim()
}

export function LessonTeaser({ courses }: { courses: CourseSummary[] }) {
  const [ref, inView] = useInView<HTMLDivElement>('300px')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [failed, setFailed] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const course = courses.find((item) => item.slug === PREFERRED_COURSE) ?? courses[0]

  useEffect(() => {
    if (!inView || !course) return
    const controller = new AbortController()
    Api.course(course.slug, controller.signal)
      .then(({ course: detail }) => {
        const first = detail.modules[0]?.lessons[0]
        if (!first) throw new Error('no lesson')
        return Api.lesson(course.slug, first.slug, controller.signal)
      })
      .then((result) => setLesson(result.lesson))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true)
      })
    loadGlossary()
      .then((glossary) => setTotal(glossary.total))
      .catch(() => undefined)
    return () => controller.abort()
  }, [inView, course])

  if (failed || !course) return null

  return (
    <div ref={ref} className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
      <div className="lg:sticky lg:top-24">
        <p className="eyebrow">Eine echte Lektion</p>
        <h2 className="section-title mt-3">Jedes Fachwort ist eine Tür.</h2>
        <p className="lead mt-4">
          Lektionen sind in kurze Seiten geteilt. Gepunktet unterstrichene Wörter erklären sich selbst – fahr mit der Maus darüber oder tippe sie an. Jeder
          Begriff, der dir beim Lesen begegnet, wandert in dein persönliches Lexikon.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-6 border-t pt-6">
          <div>
            <dt className="text-sm text-muted-foreground">Begriffe im Lexikon</dt>
            <dd className="numeric mt-1 text-3xl font-semibold">{total === null ? <Skeleton className="mt-1 h-8 w-24" /> : formatCount(total)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Davon schon deine</dt>
            <dd className="numeric mt-1 text-3xl font-semibold text-muted-foreground">0</dd>
          </div>
        </dl>
      </div>

      <LessonFrame course={course} lesson={lesson} total={total} />
    </div>
  )
}

function LessonFrame({ course, lesson, total }: { course: CourseSummary; lesson: Lesson | null; total: number | null }) {
  const reduceMotion = useReducedMotion()
  const [frameRef, visible] = useInView<HTMLDivElement>('-25% 0px')
  const pages = 6

  return (
    <div ref={frameRef} className="relative">
      <div className="overflow-hidden rounded-2xl bg-card shadow-raised">
        <div className="flex items-center gap-2 border-b px-5 py-3 text-xs text-muted-foreground">
          <CourseIcon icon={course.icon} color={course.color} size="xs" />
          <span className="truncate">{course.title} · {lesson?.module.title ?? 'Die Grundlagen'}</span>
          {lesson && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1">
              <Clock className="size-3" /> {lesson.duration_minutes} Min.
            </span>
          )}
        </div>
        <div className="px-5 pt-5 pb-2 sm:px-7 sm:pt-6">
          {lesson ? (
            <>
              <h3 className="text-2xl font-semibold tracking-[-0.02em]">{lesson.title}</h3>
              <div className="mt-4 flex gap-1" aria-hidden>
                {Array.from({ length: pages }, (_, index) => (
                  <span key={index} className={index === 0 ? 'h-1 flex-1 rounded-full bg-brand' : index >= pages - 2 ? 'h-1 flex-1 rounded-full bg-brand-2/30' : 'h-1 flex-1 rounded-full bg-muted'} />
                ))}
              </div>
              <div className="fade-bottom mt-5 max-h-[24rem] overflow-hidden text-[0.975rem] [&_.lesson-prose]:text-[0.975rem]">
                <LessonMarkdown body={excerpt(lesson.body)} terms={lesson.terms} />
              </div>
            </>
          ) : (
            <div className="space-y-3 pb-8">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-1 w-full" />
              <Skeleton className="mt-6 h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t bg-surface px-5 py-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MousePointer2 className="size-3.5 shrink-0" />
            <span className="pointer-coarse:hidden">Fahr über die gepunkteten Wörter</span>
            <span className="hidden pointer-coarse:inline">Tippe auf ein gepunktetes Wort</span>
          </span>
          {lesson && (
            <Link to={`/kurse/${course.slug}/${lesson.slug}`} className="shrink-0 font-medium text-primary hover:underline">
              Lektion öffnen
            </Link>
          )}
        </div>
      </div>

      {lesson && lesson.terms.length > 0 && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, transform: 'translateY(10px) scale(0.98)' }}
          animate={visible || reduceMotion ? { opacity: 1, transform: 'translateY(0px) scale(1)' } : undefined}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative mt-3 rounded-xl bg-popover p-3.5 shadow-raised sm:absolute sm:right-[-1rem] sm:bottom-14 sm:mx-0 sm:mt-0 sm:w-72"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-spark/15 text-spark">
              <Sparkles className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{Math.min(lesson.terms.length, 3)} neue Begriffe im Lexikon</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{lesson.terms.slice(0, 3).map((term) => term.term).join(', ')}</p>
              <p className="numeric mt-1.5 text-xs text-muted-foreground">
                {Math.min(lesson.terms.length, 3)} von {total === null ? '…' : formatCount(total)} Begriffen
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

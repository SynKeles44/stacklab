import { ArrowUpRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CourseIcon } from '@/components/common/course-icon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CourseSummary } from '@/lib/api'
import { CATEGORY_BLURBS, CATEGORY_LABELS, CATEGORY_ORDER, LEVEL_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'

const LANDMARKS = ['git', 'react', 'typescript', 'laravel', 'docker', 'aws-grundlagen']

export function LearningMap({ courses }: { courses: CourseSummary[] }) {
  const stages = useMemo(
    () => CATEGORY_ORDER.map((key) => ({ key, courses: courses.filter((course) => course.category === key).sort((a, b) => a.position - b.position) })),
    [courses],
  )
  const [stage, setStage] = useState(CATEGORY_ORDER[0]!)
  const [highlight, setHighlight] = useState<string | null>(null)
  const landmarks = LANDMARKS.map((slug) => courses.find((course) => course.slug === slug)).filter((course): course is CourseSummary => Boolean(course))

  const locate = (course: CourseSummary) => {
    setStage(course.category)
    setHighlight(course.slug)
  }

  return (
    <div>
      {landmarks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Wo steht …</span>
          {landmarks.map((course) => (
            <button
              key={course.slug}
              type="button"
              onClick={() => locate(course)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full bg-card pr-3 pl-1.5 text-sm font-medium shadow-card transition-[box-shadow,color] duration-200 hover:shadow-raised focus-visible:ring-2 focus-visible:ring-ring',
                highlight === course.slug && 'ring-2 ring-primary/60',
              )}
              aria-pressed={highlight === course.slug}
            >
              <CourseIcon icon={course.icon} color={course.color} size="xs" />
              {course.title}
            </button>
          ))}
        </div>
      )}

      <Tabs value={stage} onValueChange={(value) => { setStage(value); setHighlight(null) }} className="mt-6 gap-0">
        <div className="relative">
          <div aria-hidden className="absolute top-[1.375rem] right-[8%] left-[8%] hidden h-px bg-border md:block" />
          <TabsList variant="line" className="relative grid h-auto w-full group-data-horizontal/tabs:h-auto grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-3 md:grid-cols-6 md:gap-3">
            {stages.map((item, index) => (
              <TabsTrigger
                key={item.key}
                value={item.key}
                className="group h-auto flex-col items-start justify-start gap-0 rounded-xl border-0 bg-transparent p-1 text-left whitespace-normal after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent md:items-center md:text-center"
              >
                <span
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full bg-background font-mono text-sm font-medium shadow-card ring-4 ring-background transition-[background-color,color,box-shadow] duration-200',
                    'group-hover:shadow-raised group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="mt-2.5 text-sm leading-snug font-semibold text-foreground">{CATEGORY_LABELS[item.key]}</span>
                <span className="mt-0.5 text-xs font-normal text-muted-foreground">{item.courses.length} Kurse</span>
                <span className="mt-2 hidden -space-x-1.5 md:flex" aria-hidden>
                  {item.courses.slice(0, 5).map((course) => (
                    <CourseIcon key={course.slug} icon={course.icon} color={course.color} size="xs" solid className="ring-2 ring-background" />
                  ))}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {stages.map((item, index) => (
          <TabsContent key={item.key} value={item.key} className="mt-8 min-w-0 rounded-2xl bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="font-semibold">
                <span className="mr-2 font-mono text-sm font-medium text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                {CATEGORY_LABELS[item.key]}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.courses.reduce((sum, course) => sum + course.lessons_count, 0)} Lektionen · ca. {item.courses.reduce((sum, course) => sum + course.estimated_hours, 0)} Stunden
              </p>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{CATEGORY_BLURBS[item.key]}</p>
            <ul className="mt-5 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {item.courses.map((course) => (
                <li key={course.slug} className="min-w-0">
                  <Link
                    to={`/kurse/${course.slug}`}
                    className={cn(
                      'group/course flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted',
                      highlight === course.slug && 'bg-primary/8 ring-1 ring-primary/30',
                    )}
                  >
                    <CourseIcon icon={course.icon} color={course.color} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{course.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {LEVEL_LABELS[course.level] ?? course.level} · {course.lessons_count} Lektionen
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/course:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

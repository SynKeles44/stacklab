import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Progress } from '@/components/ui/progress'
import type { CourseSummary } from '@/lib/api'
import { LEVEL_LABELS } from '@/lib/format'
import { BookmarkButton } from './bookmark-button'
import { CourseIcon } from './course-icon'

export function CourseCard({ course }: { course: CourseSummary }) {
  const started = Boolean(course.progress && course.progress.completed > 0)
  return (
    <Link to={`/kurse/${course.slug}`} className="pressable group flex h-full flex-col rounded-xl bg-card p-5 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-start gap-3">
        <CourseIcon icon={course.icon} color={course.color} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug">{course.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {LEVEL_LABELS[course.level] ?? course.level} · {course.lessons_count} Lektionen
            {course.estimated_hours > 0 && ` · ~${course.estimated_hours} h`}
          </p>
        </div>
        <BookmarkButton type="course" refKey={course.slug} label={course.title} url={`/kurse/${course.slug}`} size="icon-sm" className="-mt-1 -mr-2 opacity-60 group-hover:opacity-100" />
      </div>
      {course.subtitle && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
      {started && (
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Progress value={course.progress!.percent} className="h-1" />
          <span className="text-xs text-muted-foreground tabular-nums">{course.progress!.percent} %</span>
        </div>
      )}
    </Link>
  )
}

export function CourseRow({ course }: { course: CourseSummary }) {
  const started = Boolean(course.progress && course.progress.completed > 0)
  return (
    <Link to={`/kurse/${course.slug}`} className="cell py-2.5">
      <CourseIcon icon={course.icon} color={course.color} size="sm" solid className="rounded-[0.5rem]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.0625rem] leading-snug">{course.title}</p>
        <p className="truncate text-[0.8125rem] text-muted-foreground">{course.subtitle ?? `${course.lessons_count} Lektionen`}</p>
      </div>
      {started && <span className="text-[0.9375rem] text-muted-foreground tabular-nums">{course.progress!.percent} %</span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />
    </Link>
  )
}

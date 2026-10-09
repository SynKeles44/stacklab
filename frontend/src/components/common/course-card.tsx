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

/** Inset-grouped list row used by the Apple variant. */
export function CourseRow({ course }: { course: CourseSummary }) {
  const started = Boolean(course.progress && course.progress.completed > 0)
  return (
    <Link to={`/kurse/${course.slug}`} className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-foreground/[0.06] hover:bg-foreground/[0.03]">
      <CourseIcon icon={course.icon} color={course.color} size="sm" className="rounded-[0.55rem]" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{course.title}</p>
        <p className="truncate text-sm text-muted-foreground">{course.subtitle ?? `${course.lessons_count} Lektionen`}</p>
      </div>
      {started && <span className="text-sm text-muted-foreground tabular-nums">{course.progress!.percent} %</span>}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
    </Link>
  )
}

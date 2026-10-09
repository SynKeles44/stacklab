import { BookOpen, Clock } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { CourseSummary } from '@/lib/api'
import { LEVEL_LABELS } from '@/lib/format'
import { CourseIcon } from './course-icon'
import { BookmarkButton } from './bookmark-button'

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      to={`/kurse/${course.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 100% at 0% 0%, color-mix(in oklab, ${course.color ?? 'var(--brand)'} 18%, transparent), transparent 70%)` }}
      />
      <div className="relative flex items-start gap-3">
        <CourseIcon icon={course.icon} color={course.color} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">Kurs {course.position}</p>
          <h3 className="font-semibold leading-snug group-hover:text-brand">{course.title}</h3>
        </div>
        <BookmarkButton type="course" refKey={course.slug} label={course.title} url={`/kurse/${course.slug}`} size="icon-sm" className="-mt-1 -mr-2" />
      </div>
      {course.subtitle && <p className="relative mt-3 line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
      <div className="relative mt-auto pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="outline">{LEVEL_LABELS[course.level] ?? course.level}</Badge>
          <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" /> {course.lessons_count} Lektionen</span>
          {course.estimated_hours > 0 && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> ~{course.estimated_hours} h</span>}
        </div>
        {course.progress && course.progress.completed > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Progress value={course.progress.percent} className="h-1.5" />
            <span className="text-xs font-medium tabular-nums">{course.progress.percent} %</span>
          </div>
        )}
      </div>
    </Link>
  )
}

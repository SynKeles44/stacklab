import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { Progress } from '@/components/ui/progress'
import type { CourseSummary } from '@/lib/api'
import { LEVEL_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BookmarkButton } from './bookmark-button'
import { CourseIcon } from './course-icon'

export function CourseCard({ course }: { course: CourseSummary }) {
  const percent = course.progress?.percent ?? 0
  const started = Boolean(course.progress && course.progress.completed > 0)
  const finished = started && percent >= 100
  return (
    <Link
      to={`/kurse/${course.slug}`}
      style={{ '--course': course.color ?? 'var(--brand)' } as CSSProperties}
      className="pressable group relative isolate flex h-full flex-col overflow-hidden rounded-xl bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-raised"
    >
      <span aria-hidden className="course-wash absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <CourseIcon icon={course.icon} color={course.color} />
        <BookmarkButton type="course" refKey={course.slug} label={course.title} url={`/kurse/${course.slug}`} size="icon-sm" className="-mt-1 -mr-2 opacity-50 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" />
      </div>
      <h3 className="mt-4 text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em]">{course.title}</h3>
      {course.subtitle && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.subtitle}</p>}
      <div className="mt-auto pt-5">
        {started ? (
          <div className="flex items-center gap-3">
            <Progress value={percent} className="h-1 flex-1" />
            <span className={cn('numeric inline-flex items-center gap-1 text-xs font-medium', finished ? 'text-success' : 'text-muted-foreground')}>
              {finished && <Check className="size-3.5" strokeWidth={2.5} />}
              {finished ? 'Fertig' : `${percent} %`}
            </span>
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LevelDots level={course.level} />
              {LEVEL_LABELS[course.level] ?? course.level}
            </span>
            <span aria-hidden className="text-border">/</span>
            <span>{course.lessons_count} Lektionen</span>
            {course.estimated_hours > 0 && (
              <>
                <span aria-hidden className="text-border">/</span>
                <span>ca. {course.estimated_hours} h</span>
              </>
            )}
          </p>
        )}
      </div>
    </Link>
  )
}

const LEVELS = ['einsteiger', 'fortgeschritten', 'profi']

export function LevelDots({ level, className }: { level: string; className?: string }) {
  const rank = Math.max(0, LEVELS.indexOf(level)) + 1
  return (
    <span aria-hidden className={cn('inline-flex items-end gap-[2px]', className)}>
      {LEVELS.map((_, index) => (
        <span key={index} className={cn('w-[3px] rounded-[1px]', index < rank ? 'bg-foreground/60' : 'bg-foreground/15')} style={{ height: `${5 + index * 2.5}px` }} />
      ))}
    </span>
  )
}

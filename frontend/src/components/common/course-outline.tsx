import { CheckCircle2, Circle, Dumbbell } from 'lucide-react'
import { Link } from 'react-router'
import type { CourseDetail } from '@/lib/api'
import { cn } from '@/lib/utils'

export function CourseOutline({ course, activeSlug, onNavigate }: { course: CourseDetail; activeSlug?: string; onNavigate?: () => void }) {
  return (
    <nav aria-label={`Inhalt: ${course.title}`} className="space-y-5">
      {course.modules.map((module, index) => (
        <div key={module.id}>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {index + 1}. {module.title}
          </p>
          <ul className="space-y-0.5">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={`/kurse/${course.slug}/${lesson.slug}`}
                  onClick={onNavigate}
                  aria-current={lesson.slug === activeSlug ? 'page' : undefined}
                  className={cn(
                    'flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                    lesson.slug === activeSlug && 'bg-brand/10 font-medium text-brand',
                  )}
                >
                  {lesson.completed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />}
                  <span>{lesson.title}</span>
                </Link>
              </li>
            ))}
            {module.exercise && (
              <li>
                <Link to={`/kurse/${course.slug}`} onClick={onNavigate} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
                  <Dumbbell className="mt-0.5 size-4 shrink-0" /> Modul-Übung
                </Link>
              </li>
            )}
          </ul>
        </div>
      ))}
    </nav>
  )
}

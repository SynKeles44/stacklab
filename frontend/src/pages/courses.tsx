import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLoaderData } from 'react-router'
import { CourseCard, CourseRow } from '@/components/common/course-card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CourseSummary } from '@/lib/api'
import { CATEGORY_LABELS, CATEGORY_ORDER, pluralize } from '@/lib/format'
import { useUiVariant } from '@/lib/ui-variant'
import { cn } from '@/lib/utils'

export function CoursesPage() {
  const courses = useLoaderData() as CourseSummary[]
  const apple = useUiVariant() === 'apple'
  const [category, setCategory] = useState('alle')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const inCategory = courses.filter((course) => category === 'alle' || course.category === category)
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return inCategory
    const matches = (text: string) => words.every((word) => text.toLowerCase().includes(word))
    const byTitle = inCategory.filter((course) => matches(`${course.title} ${course.subtitle ?? ''} ${course.slug}`))
    return byTitle.length > 0 ? byTitle : inCategory.filter((course) => matches(course.description))
  }, [courses, category, query])

  const groups = CATEGORY_ORDER.map((key) => ({ key, courses: filtered.filter((course) => course.category === key) })).filter((group) => group.courses.length > 0)
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)

  const chips = (
    <ToggleGroup type="single" value={category} onValueChange={(value) => value && setCategory(value)} variant={apple ? 'default' : 'outline'} size="sm" className="w-max">
      <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
      {CATEGORY_ORDER.map((key) => (
        <ToggleGroupItem key={key} value={key}>{CATEGORY_LABELS[key]}</ToggleGroupItem>
      ))}
    </ToggleGroup>
  )

  return (
    <div className={cn('mx-auto px-4 py-8 sm:px-6 sm:py-12', apple ? 'max-w-3xl' : 'max-w-6xl')}>
      <header className="max-w-2xl">
        <h1 className={cn(apple ? 'large-title' : 'text-3xl font-semibold tracking-tight')}>Kurse</h1>
        <p className={cn('mt-2 text-muted-foreground', apple && 'text-[1.0625rem]')}>
          {pluralize(courses.length, 'Kurs', 'Kurse')} mit {pluralize(totalLessons, 'Lektion', 'Lektionen')} in empfohlener Reihenfolge. Neu hier? Fang oben an.
        </p>
      </header>

      {apple ? (
        <div className="sticky top-14 z-30 -mx-4 mt-5 bg-background/80 backdrop-blur-xl backdrop-saturate-150 flex flex-col gap-2.5 px-4 pt-2 pb-2.5 shadow-[0_0.5px_0_var(--border)] sm:-mx-6 sm:px-6">
          <div className="search-field">
            <Search />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurse durchsuchen" aria-label="Kurse filtern" type="search" />
          </div>
          <div className="chip-scroller">{chips}</div>
        </div>
      ) : (
        <div className="sticky top-14 z-30 -mx-4 mt-6 flex flex-col gap-3 border-b bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:flex-row lg:items-center">
          <div className="relative lg:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtern" className="pl-9" aria-label="Kurse filtern" />
          </div>
          <div className="no-scrollbar -mx-1 overflow-x-auto px-1">{chips}</div>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key} className="mt-8">
          {apple ? (
            <>
              <h2 className="section-header">
                {CATEGORY_ORDER.indexOf(group.key) + 1}. {CATEGORY_LABELS[group.key]}
              </h2>
              <div className="grouped [--grouped-inset:3.75rem]">
                {group.courses.map((course) => <CourseRow key={course.slug} course={course} />)}
              </div>
            </>
          ) : (
            <>
              <h2 className="mb-4 flex items-baseline gap-2 text-lg font-semibold">
                <span className="text-muted-foreground tabular-nums">{CATEGORY_ORDER.indexOf(group.key) + 1}</span>
                {CATEGORY_LABELS[group.key]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.courses.map((course) => <CourseCard key={course.slug} course={course} />)}
              </div>
            </>
          )}
        </section>
      ))}

      {groups.length === 0 && <p className="mt-16 text-center text-muted-foreground">Kein Kurs passt zu deinem Filter.</p>}
    </div>
  )
}

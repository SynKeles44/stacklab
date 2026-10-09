import { Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useLoaderData } from 'react-router'
import { CourseCard } from '@/components/common/course-card'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CourseSummary } from '@/lib/api'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/format'

export function CoursesPage() {
  const courses = useLoaderData() as CourseSummary[]
  const [category, setCategory] = useState('alle')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(
      (course) =>
        (category === 'alle' || course.category === category) &&
        (!q || `${course.title} ${course.subtitle ?? ''} ${course.description}`.toLowerCase().includes(q)),
    )
  }, [courses, category, query])

  const groups = CATEGORY_ORDER.map((key) => ({ key, courses: filtered.filter((course) => course.category === key) })).filter((group) => group.courses.length > 0)
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dein Lernpfad</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {courses.length} Kurse mit {totalLessons} Lektionen – in empfohlener Reihenfolge. Fang oben an, wenn du neu bist, oder spring direkt zu dem Thema, das dich interessiert.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 mt-8 flex flex-col gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurse filtern …" className="pl-9" aria-label="Kurse filtern" />
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <ToggleGroup type="single" value={category} onValueChange={(value) => value && setCategory(value)} variant="outline" size="sm" className="w-max">
            <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
            {CATEGORY_ORDER.map((key) => (
              <ToggleGroupItem key={key} value={key}>{CATEGORY_LABELS[key]}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {groups.map((group, groupIndex) => (
        <section key={group.key} className="mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-primary-foreground">{CATEGORY_ORDER.indexOf(group.key) + 1}</span>
            <h2 className="text-xl font-semibold">{CATEGORY_LABELS[group.key]}</h2>
            <span className="text-sm text-muted-foreground">{group.courses.length} Kurse</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.courses.map((course, index) => (
              <motion.div key={course.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(0.03 * (index + groupIndex), 0.3) }}>
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && <p className="mt-16 text-center text-muted-foreground">Kein Kurs passt zu deinem Filter.</p>}
    </div>
  )
}

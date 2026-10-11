import { BookMarked, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { CourseCard } from '@/components/common/course-card'
import { PageHeader } from '@/components/common/page-header'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Api, type Bookmark, type CourseSummary } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { useBookmarkKeys } from '@/lib/bookmarks'
import { CATEGORY_BLURBS, CATEGORY_LABELS, CATEGORY_ORDER, pluralize } from '@/lib/format'

const ITEM_LABELS: Record<string, string> = { module: 'Modul', lesson: 'Lektion', task: 'Aufgabe', project: 'Projekt' }

function courseSlugOf(bookmark: Bookmark): string | null {
  return /^\/kurse\/([^/?#]+)/.exec(bookmark.url)?.[1] ?? null
}

export function CoursesPage() {
  const courses = useLoaderData() as CourseSummary[]
  const [category, setCategory] = useState('alle')
  const [query, setQuery] = useState('')
  const [onlyBookmarks, setOnlyBookmarks] = useState(false)
  const [items, setItems] = useState<Bookmark[]>([])
  const user = useSession()
  const bookmarkKeys = useBookmarkKeys()

  useEffect(() => {
    if (!onlyBookmarks || !user) return
    let cancelled = false
    Api.bookmarks()
      .then(({ bookmarks }) => {
        if (!cancelled) setItems(bookmarks.filter((bookmark) => bookmark.type in ITEM_LABELS && courseSlugOf(bookmark) !== null))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [onlyBookmarks, user, bookmarkKeys])

  const filtered = useMemo(() => {
    const inCategory = courses.filter(
      (course) => (category === 'alle' || course.category === category) && (!onlyBookmarks || bookmarkKeys?.has(`course:${course.slug}`)),
    )
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return inCategory
    const matches = (text: string) => words.every((word) => text.toLowerCase().includes(word))
    const byTitle = inCategory.filter((course) => matches(`${course.title} ${course.subtitle ?? ''} ${course.slug}`))
    return byTitle.length > 0 ? byTitle : inCategory.filter((course) => matches(course.description))
  }, [courses, category, query, onlyBookmarks, bookmarkKeys])

  const itemGroups = useMemo(() => {
    if (!onlyBookmarks) return []
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return courses
      .filter((course) => category === 'alle' || course.category === category)
      .map((course) => ({
        course,
        items: items.filter(
          (item) => courseSlugOf(item) === course.slug && words.every((word) => `${item.label} ${course.title}`.toLowerCase().includes(word)),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [onlyBookmarks, items, courses, category, query])

  const groups = CATEGORY_ORDER.map((key) => ({ key, courses: filtered.filter((course) => course.category === key) })).filter((group) => group.courses.length > 0)
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)

  const chips = (
    <ToggleGroup type="single" value={category} onValueChange={(value) => value && setCategory(value)} variant="outline" size="sm" className="w-max">
      <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
      {CATEGORY_ORDER.map((key) => (
        <ToggleGroupItem key={key} value={key}>{CATEGORY_LABELS[key]}</ToggleGroupItem>
      ))}
    </ToggleGroup>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        eyebrow="Lernpfad"
        title="Kurse"
        description={`${pluralize(courses.length, 'Kurs', 'Kurse')} mit ${pluralize(totalLessons, 'Lektion', 'Lektionen')} in sechs Etappen – in empfohlener Reihenfolge. Neu hier? Fang bei Etappe 01 an.`}
        aside={
          user && (
            <Toggle pressed={onlyBookmarks} onPressedChange={setOnlyBookmarks} variant="outline" className="w-fit shrink-0" aria-label="Nur Lesezeichen anzeigen">
              <BookMarked /> Meine Lesezeichen
            </Toggle>
          )
        }
      />

      <div className="sticky top-14 z-30 -mx-4 mt-8 flex flex-col gap-3 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:flex-row lg:items-center">
        <div className="relative lg:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtern" className="pl-9" aria-label="Kurse filtern" />
        </div>
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1">{chips}</div>
      </div>

      {onlyBookmarks && itemGroups.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-1 border-t pt-6 sm:flex-row sm:items-baseline sm:gap-6">
            <p className="eyebrow w-24 shrink-0">Gemerkt</p>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-[-0.015em]">Module, Lektionen und Aufgaben</h2>
              <p className="mt-1 text-sm text-muted-foreground">Alles, was du dir in den Kursen markiert hast – direkt zum Weitermachen.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {itemGroups.map(({ course, items: courseItems }) => (
              <div key={course.slug} className="rounded-xl bg-card p-4 shadow-card">
                <p className="text-sm font-semibold">{course.title}</p>
                <ul className="mt-2 divide-y">
                  {courseItems.map((item) => (
                    <li key={item.id}>
                      <Link to={item.url} className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-primary">
                        <span className="w-16 shrink-0 text-xs text-muted-foreground">{ITEM_LABELS[item.type]}</span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {groups.map((group) => (
        <section key={group.key} className="mt-12">
          <div className="mb-5 flex flex-col gap-1 border-t pt-6 sm:flex-row sm:items-baseline sm:gap-6">
            <p className="eyebrow w-24 shrink-0">Etappe {String(CATEGORY_ORDER.indexOf(group.key) + 1).padStart(2, '0')}</p>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-[-0.015em]">{CATEGORY_LABELS[group.key]}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{CATEGORY_BLURBS[group.key]}</p>
            </div>
            <p className="numeric shrink-0 text-sm text-muted-foreground">{pluralize(group.courses.length, 'Kurs', 'Kurse')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.courses.map((course) => <CourseCard key={course.slug} course={course} />)}
          </div>
        </section>
      ))}

      {groups.length === 0 && itemGroups.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          {onlyBookmarks
            ? 'Hier ist noch nichts gemerkt. Setze Lesezeichen mit dem Lesezeichen-Symbol an Kursen, Modulen, Lektionen und Aufgaben.'
            : 'Kein Kurs passt zu deinem Filter.'}
        </p>
      )}
    </div>
  )
}

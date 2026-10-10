import { BookA, BookOpen, ChevronRight, GraduationCap, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { HighlightedExcerpt } from '@/components/common/highlighted-excerpt'
import { CourseIcon } from '@/components/common/course-icon'
import { PageHeader } from '@/components/common/page-header'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Api, type SearchResult } from '@/lib/api'
import { useUiVariant } from '@/lib/ui-variant'
import { cn } from '@/lib/utils'

const SUGGESTIONS = ['git rebase', 'CORS', 'useEffect', 'N+1', 'Docker Volume', 'JWT']

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const apple = useUiVariant() === 'apple'
  const [input, setInput] = useState(query)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = query ? `„${query}“ · Suche · Stacklab` : 'Suche · Stacklab'
    if (query.trim().length < 2) {
      setResult(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    Api.search(query, controller.signal)
      .then(setResult)
      .catch(() => undefined)
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input !== query) setParams(input ? { q: input } : {}, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [input, query, setParams])

  const empty = result && result.lessons.length + result.terms.length + result.courses.length === 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {apple ? (
        <>
          <h1 className="large-title">Nachschlagen</h1>
          <p className="mt-2 text-[1.0625rem] text-muted-foreground">Durchsuche alle Lektionen, Begriffe und Kurse – Stacklab ist auch dein Handbuch.</p>
        </>
      ) : (
        <PageHeader eyebrow="Suche" title="Nachschlagen" description="Durchsuche alle Lektionen, Begriffe und Kurse – Stacklab ist auch dein Handbuch." />
      )}
      {apple ? (
        <div className="search-field mt-5">
          <Search />
          <Input autoFocus type="search" value={input} onChange={(event) => setInput(event.target.value)} placeholder="z. B. git rebase, N+1, CORS, useEffect …" aria-label="Suchbegriff" />
        </div>
      ) : (
        <div className="relative mt-8">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="z. B. git rebase, N+1, CORS, useEffect …"
            className="h-13 rounded-xl bg-card pl-12 text-base shadow-card md:text-base"
            aria-label="Suchbegriff"
          />
        </div>
      )}

      {!apple && query.trim().length < 2 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted-foreground">Probier mal</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setInput(suggestion)}
              className="rounded-full bg-card px-3 py-1 font-mono text-[0.8125rem] shadow-card transition-shadow hover:shadow-raised focus-visible:ring-2 focus-visible:ring-ring"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className={cn('h-20 w-full rounded-xl', apple && 'bg-card')} />)}
        </div>
      )}

      {!loading && result && (
        <div className="mt-8 space-y-8">
          {result.courses.length > 0 && (
            <section>
              <h2 className={cn(apple ? 'section-header flex items-center gap-1.5' : 'eyebrow mb-3 flex items-center gap-2')}><GraduationCap className="size-4" /> Kurse</h2>
              <div className="flex flex-wrap gap-2">
                {result.courses.map((course) => (
                  <Link
                    key={course.slug}
                    to={`/kurse/${course.slug}`}
                    className={cn('rounded-full text-sm', apple ? 'bg-card px-3 py-1.5 text-primary transition-colors hover:bg-[var(--fill-strong)]' : 'inline-flex items-center gap-2 bg-card py-1 pr-3 pl-1 shadow-card transition-shadow hover:shadow-raised')}
                  >
                    {!apple && <CourseIcon icon={course.icon} color={course.color} size="xs" className="rounded-full" />}
                    {course.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {result.terms.length > 0 && (
            <section>
              <h2 className={cn(apple ? 'section-header flex items-center gap-1.5' : 'eyebrow mb-3 flex items-center gap-2')}><BookA className="size-4" /> Begriffe</h2>
              <div className={cn(apple ? 'grouped' : 'grid gap-2 sm:grid-cols-2')}>
                {result.terms.map((term) => (
                  <Link key={term.slug} to={`/lexikon/${term.slug}`} className={cn(apple ? 'cell' : 'pressable rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-raised')}>
                    <div className="min-w-0 flex-1">
                      <p className={cn(apple ? 'text-[1.0625rem]' : 'font-medium')}>{term.term}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{term.short}</p>
                    </div>
                    {apple && <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {result.lessons.length > 0 && (
            <section>
              <h2 className={cn(apple ? 'section-header flex items-center gap-1.5' : 'eyebrow mb-3 flex items-center gap-2')}><BookOpen className="size-4" /> Lektionen</h2>
              <ul className={cn(apple ? 'grouped' : 'space-y-2')}>
                {result.lessons.map((lesson) => (
                  <li key={`${lesson.course_slug}/${lesson.slug}`}>
                    <Link to={`/kurse/${lesson.course_slug}/${lesson.slug}`} className={cn(apple ? 'block px-4 py-3 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.08]' : 'pressable block rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-raised')}>
                      <p className="text-xs text-muted-foreground">{lesson.course_title}</p>
                      <p className="font-semibold">{lesson.title}</p>
                      {lesson.excerpt ? <HighlightedExcerpt text={lesson.excerpt} className="mt-1 text-sm text-muted-foreground" /> : lesson.summary && <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {empty && <p className="py-12 text-center text-muted-foreground">Keine Treffer für „{query}“. Versuch ein anderes Wort.</p>}
        </div>
      )}
    </div>
  )
}

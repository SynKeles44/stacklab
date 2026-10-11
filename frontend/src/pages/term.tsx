import { ArrowRight, BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLoaderData } from 'react-router'
import { BookmarkButton } from '@/components/common/bookmark-button'
import { SmallMarkdown } from '@/components/tasks/task-card'
import { Badge } from '@/components/ui/badge'
import type { Term } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { requestUnlock } from '@/lib/unlocks'

type TermDetail = Term & { related: { slug: string; term: string; short: string }[] }

export function TermPage() {
  const term = useLoaderData() as TermDetail

  useEffect(() => {
    document.title = `${term.term} · Lexikon · Stacklab`
    requestUnlock(term.slug)
  }, [term.slug, term.term])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Brotkrumen" className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/lexikon" className="hover:text-foreground">Lexikon</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-xs tracking-[0.04em] uppercase">{term.category}</span>
      </nav>

      <header className="mt-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title break-words">{term.term}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {term.aliases.map((alias) => <Badge key={alias} variant="secondary" className="font-normal">{alias}</Badge>)}
            {term.unlocked_at ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-spark" /> In deinem Lexikon seit {formatDate(term.unlocked_at)}</span>
            ) : null}
          </div>
        </div>
        <BookmarkButton type="term" refKey={term.slug} label={term.term} url={`/lexikon/${term.slug}`} />
      </header>

      <p className="mt-8 text-xl leading-relaxed font-medium tracking-[-0.01em] text-pretty sm:text-[1.375rem]">{term.short}</p>
      <SmallMarkdown text={term.explanation} className="mt-5 text-[1.0625rem]" />

      {term.example && (
        <div className="mt-8 overflow-hidden rounded-xl bg-card shadow-card">
          <p className="eyebrow border-b px-4 py-2.5">Beispiel</p>
          <div className="px-4 py-4">
            <SmallMarkdown text={term.example} />
          </div>
        </div>
      )}

      {term.lesson?.course_slug && (
        <Link
          to={`/kurse/${term.lesson.course_slug}/${term.lesson.slug}`}
          className="pressable group mt-6 flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-raised"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookOpen className="size-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">Ausführlich erklärt in der Lektion</span>
            <span className="block truncate font-medium">{term.lesson.title}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}

      {term.related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-base font-semibold">Verwandte Begriffe</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {term.related.map((related) => (
              <Link key={related.slug} to={`/lexikon/${related.slug}`} className="pressable rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-raised">
                <p className="font-medium">{related.term}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{related.short}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

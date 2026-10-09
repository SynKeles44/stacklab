import { ArrowLeft, BookA, BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLoaderData } from 'react-router'
import { BookmarkButton } from '@/components/common/bookmark-button'
import { SmallMarkdown } from '@/components/tasks/task-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Term } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { useUiVariant } from '@/lib/ui-variant'
import { requestUnlock } from '@/lib/unlocks'
import { cn } from '@/lib/utils'

type TermDetail = Term & { related: { slug: string; term: string; short: string }[] }

export function TermPage() {
  const term = useLoaderData() as TermDetail
  const apple = useUiVariant() === 'apple'

  useEffect(() => {
    document.title = `${term.term} · Lexikon · Stacklab`
    requestUnlock(term.slug)
  }, [term.slug, term.term])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {apple ? (
        <Link to="/lexikon" className="-ml-1.5 inline-flex items-center text-[1.0625rem] text-primary hover:opacity-70"><ChevronLeft className="size-6" strokeWidth={2.25} /> Lexikon</Link>
      ) : (
        <Link to="/lexikon" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Lexikon</Link>
      )}
      <header className="mt-4 flex items-start gap-3">
        <span className={cn('flex size-12 shrink-0 items-center justify-center', apple ? 'rounded-[0.75rem] bg-primary text-white' : 'rounded-2xl bg-brand/12 text-brand')}><BookA className="size-6" /></span>
        <div className="flex-1">
          <h1 className={cn(apple ? 'large-title' : 'text-3xl font-bold tracking-tight sm:text-4xl')}>{term.term}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{term.category}</Badge>
            {term.aliases.map((alias) => <Badge key={alias} variant="outline">{alias}</Badge>)}
            {term.unlocked_at && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="size-3 text-brand" /> freigeschaltet am {formatDate(term.unlocked_at)}</span>}
          </div>
        </div>
        <BookmarkButton type="term" refKey={term.slug} label={term.term} url={`/lexikon/${term.slug}`} />
      </header>

      <p className="mt-8 text-xl font-medium leading-relaxed">{term.short}</p>
      <SmallMarkdown text={term.explanation} className="mt-4" />

      {term.example && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Beispiel</p>
            <SmallMarkdown text={term.example} />
          </CardContent>
        </Card>
      )}

      {term.lesson?.course_slug && (
        apple ? (
          <div className="grouped mt-6">
            <Link to={`/kurse/${term.lesson.course_slug}/${term.lesson.slug}`} className="cell">
              <span className="icon-tile bg-[#ff9500]"><BookOpen /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] text-muted-foreground">Ausführlich erklärt in der Lektion</p>
                <p className="truncate text-[1.0625rem]">{term.lesson.title}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <Link to={`/kurse/${term.lesson.course_slug}/${term.lesson.slug}`} className="mt-6 flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-brand/50">
            <BookOpen className="size-5 text-brand" />
            <div>
              <p className="text-xs text-muted-foreground">Ausführlich erklärt in der Lektion</p>
              <p className="font-medium">{term.lesson.title}</p>
            </div>
          </Link>
        )
      )}

      {term.related.length > 0 && (
        <section className="mt-10">
          <h2 className={cn(apple ? 'section-header' : 'mb-3 font-semibold')}>Verwandte Begriffe</h2>
          <div className={cn(apple ? 'grouped' : 'grid gap-2 sm:grid-cols-2')}>
            {term.related.map((related) => (
              <Link key={related.slug} to={`/lexikon/${related.slug}`} className={cn(apple ? 'cell' : 'rounded-xl border p-3 transition-colors hover:border-brand/50')}>
                <div className="min-w-0 flex-1">
                  <p className={cn(apple ? 'text-[1.0625rem]' : 'font-medium')}>{related.term}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{related.short}</p>
                </div>
                {apple && <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

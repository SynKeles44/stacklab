import { BookA, Lock, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Term } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { cn } from '@/lib/utils'

type GlossaryData = { terms: Term[]; unlocked_count: number; total: number }

export function GlossaryPage() {
  const { terms, unlocked_count, total } = useLoaderData() as GlossaryData
  const user = useSession()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'alle' | 'meine' | 'offen'>('alle')
  const [category, setCategory] = useState('alle')

  useEffect(() => {
    document.title = 'Lexikon · Stacklab'
  }, [])

  const categories = useMemo(() => [...new Set(terms.map((term) => term.category))].sort(), [terms])
  const filtered = terms.filter((term) => {
    const q = query.trim().toLowerCase()
    if (q && !`${term.term} ${term.aliases.join(' ')} ${term.short}`.toLowerCase().includes(q)) return false
    if (filter === 'meine' && !term.unlocked_at) return false
    if (filter === 'offen' && term.unlocked_at) return false
    return category === 'alle' || term.category === category
  })

  const letters = useMemo(() => {
    const groups = new Map<string, Term[]>()
    for (const term of filtered) {
      const letter = /^[a-zäöü]/i.test(term.term) ? term.term[0]!.toUpperCase().replace('Ä', 'A').replace('Ö', 'O').replace('Ü', 'U') : '#'
      groups.set(letter, [...(groups.get(letter) ?? []), term])
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'de'))
  }, [filtered])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl"><BookA className="size-8 text-brand" /> Lexikon</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Jedes Fachwort, kurz und verständlich erklärt. Begriffe, die dir beim Lesen begegnen, landen automatisch in deinem persönlichen Lexikon.
          </p>
        </div>
        {user && (
          <div className="w-full rounded-2xl border bg-card p-4 sm:w-72">
            <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-brand" /> Dein Lexikon</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{unlocked_count} <span className="text-base font-normal text-muted-foreground">von {total} Begriffen</span></p>
            <Progress value={total ? (unlocked_count / total) * 100 : 0} className="mt-2 h-1.5" />
          </div>
        )}
      </header>

      <div className="sticky top-14 z-30 -mx-4 mt-8 flex flex-col gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Begriff suchen …" className="pl-9" aria-label="Begriffe filtern" />
        </div>
        {user && (
          <ToggleGroup type="single" value={filter} onValueChange={(value) => value && setFilter(value as typeof filter)} variant="outline" size="sm">
            <ToggleGroupItem value="alle">Alle</ToggleGroupItem>
            <ToggleGroupItem value="meine">Freigeschaltet</ToggleGroupItem>
            <ToggleGroupItem value="offen">Noch offen</ToggleGroupItem>
          </ToggleGroup>
        )}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:ml-auto md:w-56" aria-label="Kategorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Kategorien</SelectItem>
            {categories.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 space-y-10">
        {letters.map(([letter, items]) => (
          <section key={letter}>
            <h2 className="mb-3 text-2xl font-bold text-brand">{letter}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((term) => {
                const locked = Boolean(user) && !term.unlocked_at
                return (
                  <Link key={term.slug} to={`/lexikon/${term.slug}`} className={cn('flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-brand/50', locked && 'bg-muted/30')}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{term.term}</span>
                        {locked ? <Lock className="size-3.5 text-muted-foreground" /> : user ? <Sparkles className="size-3.5 text-brand" /> : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{term.short}</p>
                      <span className="mt-auto pt-2 text-xs text-muted-foreground">{term.category}</span>
                    </Link>
                )
              })}
            </div>
          </section>
        ))}
        {letters.length === 0 && <p className="py-16 text-center text-muted-foreground">Keine Begriffe gefunden.</p>}
      </div>
    </div>
  )
}

import { BookA, BookOpen, CornerDownLeft, GraduationCap, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Api, type SearchResult } from '@/lib/api'
import { HighlightedExcerpt } from '@/components/common/highlighted-excerpt'

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResult(null)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      Api.search(query, controller.signal).then(setResult).catch(() => undefined)
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const go = (path: string) => {
    onOpenChange(false)
    setQuery('')
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Suche" description="Kurse, Lektionen und Begriffe durchsuchen" className="sm:max-w-2xl">
      <CommandInput placeholder="Suche nach Lektionen, Begriffen, Kursen …" value={query} onValueChange={setQuery} />
      <CommandList className="max-h-[60vh]">
        {query.trim().length >= 2 && <CommandEmpty>Nichts gefunden.</CommandEmpty>}
        {result && result.courses.length > 0 && (
          <CommandGroup heading="Kurse">
            {result.courses.map((course) => (
              <CommandItem key={course.slug} value={`kurs-${course.slug}`} onSelect={() => go(`/kurse/${course.slug}`)}>
                <GraduationCap />
                <span>{course.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {result && result.terms.length > 0 && (
          <CommandGroup heading="Lexikon">
            {result.terms.map((term) => (
              <CommandItem key={term.slug} value={`begriff-${term.slug}`} onSelect={() => go(`/lexikon/${term.slug}`)}>
                <BookA />
                <span className="font-medium">{term.term}</span>
                <span className="truncate text-muted-foreground">{term.short}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {result && result.lessons.length > 0 && (
          <CommandGroup heading="Lektionen">
            {result.lessons.map((lesson) => (
              <CommandItem key={`${lesson.course_slug}/${lesson.slug}`} value={`lektion-${lesson.course_slug}-${lesson.slug}`} onSelect={() => go(`/kurse/${lesson.course_slug}/${lesson.slug}`)} className="items-start">
                <BookOpen className="mt-0.5" />
                <div className="min-w-0">
                  <div className="font-medium">{lesson.title}</div>
                  <div className="text-xs text-muted-foreground">{lesson.course_title}</div>
                  {lesson.excerpt && <HighlightedExcerpt text={lesson.excerpt} className="mt-1 line-clamp-2 text-xs text-muted-foreground" />}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {query.trim().length >= 2 && (
          <CommandGroup heading="Volltextsuche">
            <CommandItem value="alle-ergebnisse" onSelect={() => go(`/suche?q=${encodeURIComponent(query)}`)}>
              <Search />
              Alle Ergebnisse für „{query}“
              <CornerDownLeft className="ml-auto" />
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

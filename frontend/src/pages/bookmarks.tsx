import { BookA, BookMarked, BookOpen, FolderGit2, GraduationCap, Layers, ListChecks, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Api, type Bookmark } from '@/lib/api'
import { forgetBookmark } from '@/lib/bookmarks'
import { formatDate } from '@/lib/format'
import { useUiVariant } from '@/lib/ui-variant'
import { cn } from '@/lib/utils'

const TYPES: Record<string, { label: string; icon: typeof BookA; tint: string }> = {
  course: { label: 'Kurse', icon: GraduationCap, tint: '#007aff' },
  module: { label: 'Module', icon: Layers, tint: '#5856d6' },
  lesson: { label: 'Lektionen', icon: BookOpen, tint: '#ff9500' },
  term: { label: 'Begriffe', icon: BookA, tint: '#34c759' },
  task: { label: 'Aufgaben', icon: ListChecks, tint: '#ff2d55' },
  project: { label: 'Projekte', icon: FolderGit2, tint: '#8e8e93' },
}

export function BookmarksPage() {
  const initial = useLoaderData() as Bookmark[]
  const [bookmarks, setBookmarks] = useState(initial)
  const apple = useUiVariant() === 'apple'

  useEffect(() => {
    document.title = 'Lesezeichen · Stacklab'
  }, [])

  const remove = async (bookmark: Bookmark) => {
    await Api.deleteBookmark(bookmark.id)
    forgetBookmark(bookmark.type, bookmark.ref)
    setBookmarks((previous) => previous.filter((item) => item.id !== bookmark.id))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {apple ? (
        <h1 className="large-title">Lesezeichen</h1>
      ) : (
        <PageHeader eyebrow={bookmarks.length === 0 ? 'Gemerkt' : `${bookmarks.length} gemerkt`} title="Lesezeichen" description="Kurse, Lektionen, Aufgaben und Begriffe, zu denen du zurückkehren willst." />
      )}
      {bookmarks.length === 0 ? (
        <Empty className={cn(apple ? 'mt-6 border' : 'mt-10 border bg-card/50')}>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookMarked /></EmptyMedia>
            <EmptyTitle>Noch keine Lesezeichen</EmptyTitle>
            <EmptyDescription>Markiere Kurse, Module, Lektionen und Begriffe mit dem Lesezeichen-Symbol, um sie hier wiederzufinden.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        Object.entries(TYPES).map(([type, meta]) => {
          const items = bookmarks.filter((bookmark) => bookmark.type === type)
          if (items.length === 0) return null
          return (
            <section key={type} className={cn(apple ? 'mt-7' : 'mt-8')}>
              {apple ? (
                <h2 className="section-header">{meta.label}</h2>
              ) : (
                <h2 className="eyebrow mb-3 flex items-center gap-2"><meta.icon className="size-3.5" /> {meta.label}</h2>
              )}
              <ul className={cn(apple ? 'grouped [--grouped-inset:3.625rem]' : 'space-y-2')}>
                {items.map((bookmark) => (
                  <li key={bookmark.id} className={cn('flex items-center gap-2 pr-2', !apple && 'rounded-xl bg-card shadow-card')}>
                    <Link to={bookmark.url} className={cn('min-w-0 flex-1', apple ? 'cell pr-1' : 'p-3')}>
                      {apple && <span className="icon-tile" style={{ backgroundColor: meta.tint }}><meta.icon /></span>}
                      <div className="min-w-0 flex-1">
                        <p className={cn('truncate', apple ? 'text-[1.0625rem]' : 'font-medium')}>{bookmark.label}</p>
                        <p className={cn('text-muted-foreground', apple ? 'text-[0.8125rem]' : 'text-xs')}>gemerkt am {formatDate(bookmark.created_at)}</p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" aria-label="Lesezeichen entfernen" onClick={() => remove(bookmark)} className={cn(apple && 'text-destructive')}><Trash2 /></Button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}

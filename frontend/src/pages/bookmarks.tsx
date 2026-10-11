import { BookA, BookMarked, BookOpen, FolderGit2, GraduationCap, Layers, ListChecks, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Api, type Bookmark } from '@/lib/api'
import { forgetBookmark } from '@/lib/bookmarks'
import { formatDate } from '@/lib/format'

const TYPES: Record<string, { label: string; icon: typeof BookA }> = {
  course: { label: 'Kurse', icon: GraduationCap },
  module: { label: 'Module', icon: Layers },
  lesson: { label: 'Lektionen', icon: BookOpen },
  term: { label: 'Begriffe', icon: BookA },
  task: { label: 'Aufgaben', icon: ListChecks },
  project: { label: 'Projekte', icon: FolderGit2 },
}

export function BookmarksPage() {
  const initial = useLoaderData() as Bookmark[]
  const [bookmarks, setBookmarks] = useState(initial)

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
      <PageHeader eyebrow={bookmarks.length === 0 ? 'Gemerkt' : `${bookmarks.length} gemerkt`} title="Lesezeichen" description="Kurse, Lektionen, Aufgaben und Begriffe, zu denen du zurückkehren willst." />
      {bookmarks.length === 0 ? (
        <Empty className="mt-10 border bg-card/50">
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
            <section key={type} className="mt-8">
              <h2 className="eyebrow mb-3 flex items-center gap-2"><meta.icon className="size-3.5" /> {meta.label}</h2>
              <ul className="space-y-2">
                {items.map((bookmark) => (
                  <li key={bookmark.id} className="flex items-center gap-2 rounded-xl bg-card pr-2 shadow-card">
                    <Link to={bookmark.url} className="min-w-0 flex-1 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{bookmark.label}</p>
                        <p className="text-xs text-muted-foreground">gemerkt am {formatDate(bookmark.created_at)}</p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" aria-label="Lesezeichen entfernen" onClick={() => remove(bookmark)}><Trash2 /></Button>
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

import { NotebookPen } from 'lucide-react'
import { useEffect } from 'react'
import Markdown from 'react-markdown'
import { Link, useLoaderData } from 'react-router'
import { PageHeader } from '@/components/common/page-header'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatDateTime } from '@/lib/format'

type Note = { id: number; body: string; updated_at: string; lesson_slug: string; lesson_title: string; course_slug: string; course_title: string }

export function NotesPage() {
  const notes = useLoaderData() as Note[]

  useEffect(() => {
    document.title = 'Notizen · Stacklab'
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader eyebrow={notes.length === 0 ? 'Notizen' : `${notes.length} Notizen`} title="Deine Notizen" description="Alles, was du dir unter einer Lektion notiert hast – an einem Ort." />
      {notes.length === 0 ? (
        <Empty className="mt-10 border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon"><NotebookPen /></EmptyMedia>
            <EmptyTitle>Noch keine Notizen</EmptyTitle>
            <EmptyDescription>Unter jeder Lektion findest du ein Notizfeld. Alles, was du dort schreibst, sammelt sich hier.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="mt-8 space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl bg-card p-5 shadow-card sm:p-6">
              <Link to={`/kurse/${note.course_slug}/${note.lesson_slug}`} className="group">
                <p className="text-xs text-muted-foreground">{note.course_title} · {formatDateTime(note.updated_at)}</p>
                <p className="font-semibold group-hover:text-brand">{note.lesson_title}</p>
              </Link>
              <div className="lesson-prose mt-3 text-sm [&>*+*]:mt-2">
                <Markdown>{note.body}</Markdown>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

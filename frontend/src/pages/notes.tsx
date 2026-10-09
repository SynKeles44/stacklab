import { NotebookPen } from 'lucide-react'
import { useEffect } from 'react'
import Markdown from 'react-markdown'
import { Link, useLoaderData } from 'react-router'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatDateTime } from '@/lib/format'
import { useUiVariant } from '@/lib/ui-variant'
import { cn } from '@/lib/utils'

type Note = { id: number; body: string; updated_at: string; lesson_slug: string; lesson_title: string; course_slug: string; course_title: string }

export function NotesPage() {
  const notes = useLoaderData() as Note[]
  const apple = useUiVariant() === 'apple'

  useEffect(() => {
    document.title = 'Notizen · Stacklab'
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {apple ? (
        <h1 className="large-title">Deine Notizen</h1>
      ) : (
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><NotebookPen className="size-7 text-brand" /> Deine Notizen</h1>
      )}
      {notes.length === 0 ? (
        <Empty className={cn('border', apple ? 'mt-6' : 'mt-10')}>
          <EmptyHeader>
            <EmptyMedia variant="icon"><NotebookPen /></EmptyMedia>
            <EmptyTitle>Noch keine Notizen</EmptyTitle>
            <EmptyDescription>Unter jeder Lektion findest du ein Notizfeld. Alles, was du dort schreibst, sammelt sich hier.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className={cn(apple ? 'mt-6 space-y-3' : 'mt-8 space-y-4')}>
          {notes.map((note) => (
            <li key={note.id} className={cn('bg-card p-5', apple ? 'rounded-xl' : 'rounded-2xl border')}>
              <Link to={`/kurse/${note.course_slug}/${note.lesson_slug}`} className="group">
                <p className={cn('text-muted-foreground', apple ? 'text-[0.8125rem]' : 'text-xs')}>{note.course_title} · {formatDateTime(note.updated_at)}</p>
                <p className={cn('font-semibold', apple ? 'text-[1.0625rem] group-hover:text-primary' : 'group-hover:text-brand')}>{note.lesson_title}</p>
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

import { AlertTriangle, SearchX } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ApiError } from '@/lib/api'

export function RouteError() {
  const error = useRouteError()
  const notFound = (isRouteErrorResponse(error) && error.status === 404) || (error instanceof ApiError && error.status === 404)
  const message = error instanceof Error ? error.message : isRouteErrorResponse(error) ? error.statusText : 'Unbekannter Fehler'

  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{notFound ? <SearchX /> : <AlertTriangle />}</EmptyMedia>
          <EmptyTitle>{notFound ? 'Seite nicht gefunden' : 'Da ist etwas schiefgelaufen'}</EmptyTitle>
          <EmptyDescription>
            {notFound
              ? 'Diese Seite gibt es nicht (mehr). Vielleicht hilft die Suche weiter.'
              : `${message}. Läuft das Backend? Prüfe mit "make logs".`}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/">Zur Startseite</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

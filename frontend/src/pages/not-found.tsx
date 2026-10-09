import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
          <EmptyTitle>404 – Seite nicht gefunden</EmptyTitle>
          <EmptyDescription>Diese Adresse gibt es nicht. Vielleicht findest du über die Suche, was du brauchst.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button asChild><Link to="/">Startseite</Link></Button>
          <Button asChild variant="outline"><Link to="/suche">Suche</Link></Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

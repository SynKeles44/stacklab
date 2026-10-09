import { ArrowUp, ChevronRight, Folder, FolderCheck, FolderPlus, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Api, type FolderListing } from '@/lib/api'
import { ApiError } from '@/lib/api/client'

const DEFAULT_NAME = 'stacklab-workspace'
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._ -]*$/

export function FolderPicker({ onChanged }: { onChanged: (result: { path: string; command: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [listing, setListing] = useState<FolderListing | null>(null)
  const [path, setPath] = useState<string | undefined>(undefined)
  const [name, setName] = useState(DEFAULT_NAME)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    setListing(null)
    Api.folders(path, controller.signal)
      .then(setListing)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) toast.error(reason instanceof Error ? reason.message : 'Ordner konnten nicht geladen werden')
      })
    return () => controller.abort()
  }, [open, path])

  const trimmed = name.trim()
  const nameValid = NAME_PATTERN.test(trimmed) && !trimmed.includes('..')
  const target = listing ? `${listing.label === '~' ? '~' : listing.label}/${trimmed}` : ''

  const create = async (folderName: string) => {
    if (!listing) return
    setSaving(true)
    setError(null)
    try {
      const result = await Api.createWorkspace(listing.path, folderName)
      onChanged(result)
      setOpen(false)
      toast.success('Workspace-Ordner gespeichert')
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(Object.values(reason.errors).flat()[0] ?? reason.message)
      } else {
        setError(reason instanceof Error ? reason.message : 'Speichern fehlgeschlagen')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setPath(undefined)
          setName(DEFAULT_NAME)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          <FolderPlus /> Ordner auswählen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Wo soll dein Workspace liegen?</DialogTitle>
          <DialogDescription>Öffne den Ort, an dem Stacklab einen neuen Ordner für deine Übungen anlegen soll.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Benutzerordner" onClick={() => setPath(undefined)} disabled={!listing?.parent}>
            <Home />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Eine Ebene nach oben" onClick={() => listing?.parent && setPath(listing.parent)} disabled={!listing?.parent}>
            <ArrowUp />
          </Button>
          <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 font-mono text-sm" title={listing?.path}>
            {listing?.label ?? '…'}
          </code>
        </div>

        <ScrollArea className="h-64 rounded-lg border">
          {!listing ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : listing.entries.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Keine Unterordner.</p>
          ) : (
            <ul className="p-1">
              {listing.entries.map((entry) => (
                <li key={entry.path} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPath(entry.path)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {entry.workspace ? <FolderCheck className="size-4 shrink-0 text-primary" /> : <Folder className="size-4 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{entry.name}</span>
                    {entry.workspace && <Badge variant="secondary">Stacklab</Badge>}
                    <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </button>
                  {entry.workspace && (
                    <Button variant="ghost" size="sm" disabled={saving} onClick={() => void create(entry.name)}>
                      Verwenden
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <Field data-invalid={Boolean(error) || (trimmed !== '' && !nameValid)}>
          <FieldLabel htmlFor="workspace-name">Name des neuen Ordners</FieldLabel>
          <Input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)} spellCheck={false} className="font-mono" />
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldDescription>
              Wird angelegt als <code className="font-mono">{target}</code>. Ein bestehender Ordner geht nur, wenn er leer ist.
            </FieldDescription>
          )}
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button onClick={() => void create(trimmed)} disabled={!listing || !nameValid || saving}>
            {saving ? <Spinner /> : <FolderPlus />} Hier anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

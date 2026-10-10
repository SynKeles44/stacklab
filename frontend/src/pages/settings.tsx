import { Check, CheckCircle2, Copy, FolderCog, FolderSearch, Palette, RotateCcw, Save, TerminalSquare, UserRound, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { AppearancePicker } from '@/components/common/appearance-picker'
import { FolderPicker } from '@/components/common/folder-picker'
import { PageHeader } from '@/components/common/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Api, type SandboxStatus } from '@/lib/api'
import { updateSessionUser, useSession } from '@/lib/auth'
import { loadBookmarks } from '@/lib/bookmarks'
import { useUiVariant } from '@/lib/ui-variant'

type WorkspaceInfo = { path: string; writable: boolean; browse?: boolean; sandbox: SandboxStatus }

export function SettingsPage() {
  const workspace = useLoaderData() as WorkspaceInfo
  const user = useSession()
  const [path, setPath] = useState(workspace.path)
  const [restart, setRestart] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [password, setPassword] = useState('')

  useEffect(() => {
    document.title = 'Einstellungen · Stacklab'
  }, [])

  const saveWorkspace = async () => {
    setSaving(true)
    try {
      const result = await Api.updateWorkspace(path)
      setRestart(result.command)
      toast.success('Workspace-Pfad gespeichert')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    try {
      const result = await Api.updateMe({ name, ...(password ? { password } : {}) })
      updateSessionUser(result.user)
      setPassword('')
      toast.success('Profil gespeichert')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Speichern fehlgeschlagen')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      {useUiVariant() === 'apple' ? <h1 className="large-title">Einstellungen</h1> : <PageHeader eyebrow="Konto" title="Einstellungen" className="pb-2" />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="size-5 text-primary" /> Darstellung</CardTitle>
          <CardDescription>Wähle das Design der Oberfläche. Deine Wahl wird in deinem Konto gespeichert.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearancePicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderCog className="size-5 text-primary" /> Workspace-Ordner</CardTitle>
          <CardDescription>
            Hier legt das Übungs-Terminal alles ab, was du baust – pro Kurs ein eigener Unterordner. Du kannst den Ordner jederzeit mit deinem Editor öffnen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="workspace">Pfad auf deinem Rechner</FieldLabel>
              <Input id="workspace" value={path} onChange={(event) => setPath(event.target.value)} className="font-mono" spellCheck={false} />
              <FieldDescription>Relativ zum Stacklab-Ordner (z. B. ./workspace) oder absolut (z. B. /Users/du/lernen oder C:/Users/du/lernen).</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveWorkspace} disabled={saving || !workspace.writable || path === workspace.path} className="w-fit">
                {saving ? <Spinner /> : <Save />} Pfad speichern
              </Button>
              {workspace.browse && workspace.writable && (
                <FolderPicker
                  onChanged={(result) => {
                    setPath(result.path)
                    setRestart(result.command)
                  }}
                />
              )}
            </div>
          </FieldGroup>
          {!workspace.browse && <FolderPickerHint />}
          {!workspace.writable && (
            <p className="mt-3 text-sm text-muted-foreground">Die .env-Datei ist aus dem Container nicht beschreibbar. Trage <code className="font-mono">STACKLAB_WORKSPACE</code> von Hand in die Datei <code className="font-mono">.env</code> ein.</p>
          )}
          {restart && (
            <Alert className="mt-4">
              <TerminalSquare />
              <AlertTitle>Noch ein Schritt</AlertTitle>
              <AlertDescription>
                Docker legt den Ordner an und bindet ihn beim Neustart ein. Führe im Stacklab-Ordner <Kbd>{restart}</Kbd> aus, dann ist der neue Pfad aktiv.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TerminalSquare className="size-5 text-primary" /> Übungs-Terminal</CardTitle>
          <CardDescription>Status des Sandbox-Containers und der installierten Werkzeuge.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 font-medium">
            {workspace.sandbox.ok ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
            {workspace.sandbox.ok ? 'Sandbox läuft' : 'Sandbox nicht erreichbar – prüfe "make logs"'}
          </p>
          {workspace.sandbox.tools && (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              {Object.entries(workspace.sandbox.tools).map(([tool, version]) => (
                <div key={tool} className="contents">
                  <dt className="font-medium">{tool}</dt>
                  <dd className="truncate font-mono text-muted-foreground">{version}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" /> Profil</CardTitle>
          <CardDescription>Dein Name erscheint auf deinen Zertifikaten.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Neues Passwort</FieldLabel>
              <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="leer lassen = unverändert" />
            </Field>
            <Button onClick={saveProfile} className="w-fit"><Save /> Profil speichern</Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <ResetProgressCard />
    </div>
  )
}

const PICKER_COMMAND = 'make workspace'

function FolderPickerHint() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PICKER_COMMAND)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Kopieren nicht möglich – tippe den Befehl bitte ab.')
    }
  }

  return (
    <div className="mt-5 rounded-lg bg-muted/60 p-4">
      <p className="flex items-center gap-2 text-sm font-medium"><FolderSearch className="size-4 text-primary" /> Lieber mit dem Finder auswählen?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Aus Sicherheitsgründen darf der Browser keine Ordnerpfade deines Rechners lesen. Führe deshalb im Stacklab-Ordner diesen Befehl aus – er öffnet den
        Ordner-Dialog deines Systems (Finder, Explorer oder Dateiauswahl), speichert die Wahl und startet das Übungs-Terminal neu.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="rounded-md bg-background px-3 py-1.5 font-mono text-sm shadow-card">{PICKER_COMMAND}</code>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? 'Kopiert' : 'Kopieren'}
        </Button>
      </div>
    </div>
  )
}

function ResetProgressCard() {
  const revalidator = useRevalidator()
  const [includeNotes, setIncludeNotes] = useState(false)
  const [busy, setBusy] = useState(false)

  const reset = async () => {
    setBusy(true)
    try {
      await Api.resetProgress(includeNotes)
      await loadBookmarks(true)
      void revalidator.revalidate()
      toast.success(includeNotes ? 'Fortschritt, Notizen und Lesezeichen gelöscht' : 'Fortschritt gelöscht')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Zurücksetzen fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><RotateCcw className="size-5 text-destructive" /> Fortschritt zurücksetzen</CardTitle>
        <CardDescription>
          Löscht abgeschlossene Lektionen, Quiz- und Prüfungsergebnisse, gelöste Aufgaben, Projektschritte und freigeschaltete Lexikon-Begriffe. Die Dateien in deinem
          Workspace-Ordner bleiben unangetastet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={busy}>
              {busy ? <Spinner /> : <RotateCcw />} Fortschritt zurücksetzen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Wirklich von vorn beginnen?</AlertDialogTitle>
              <AlertDialogDescription>Dein gesamter Lernfortschritt wird gelöscht. Das lässt sich nicht rückgängig machen.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-3">
              <Checkbox id="reset-notes" checked={includeNotes} onCheckedChange={(value) => setIncludeNotes(value === true)} />
              <Label htmlFor="reset-notes" className="font-normal">Notizen und Lesezeichen ebenfalls löschen</Label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={reset}>Endgültig löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

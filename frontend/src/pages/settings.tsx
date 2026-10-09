import { CheckCircle2, FolderCog, Palette, Save, TerminalSquare, UserRound, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router'
import { toast } from 'sonner'
import { AppearancePicker } from '@/components/common/appearance-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { Api, type SandboxStatus } from '@/lib/api'
import { updateSessionUser, useSession } from '@/lib/auth'

type WorkspaceInfo = { path: string; writable: boolean; sandbox: SandboxStatus }

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
      <h1 className="text-3xl font-semibold tracking-tight">Einstellungen</h1>

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
            <Button onClick={saveWorkspace} disabled={saving || !workspace.writable || path === workspace.path} className="w-fit">
              {saving ? <Spinner /> : <Save />} Pfad speichern
            </Button>
          </FieldGroup>
          {!workspace.writable && (
            <p className="mt-3 text-sm text-muted-foreground">Die .env-Datei ist aus dem Container nicht beschreibbar. Trage <code className="font-mono">STACKLAB_WORKSPACE</code> von Hand in die Datei <code className="font-mono">.env</code> ein.</p>
          )}
          {restart && (
            <Alert className="mt-4">
              <TerminalSquare />
              <AlertTitle>Noch ein Schritt</AlertTitle>
              <AlertDescription>
                Docker bindet den Ordner beim Start ein. Führe im Stacklab-Ordner <Kbd>{restart}</Kbd> aus (oder <Kbd>make restart</Kbd>), dann ist der neue Pfad aktiv.
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
    </div>
  )
}

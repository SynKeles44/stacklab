import { FolderOpen, Play, RotateCcw, ShieldCheck, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { RealTerminal } from '@/components/code/lazy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Api, type CheckResult } from '@/lib/api'
import { useSession } from '@/lib/auth'
import type { TaskOf } from '@/lib/content-schemas'
import { CheckResults } from './check-results'
import type { TaskContext } from './task-renderer'

export function TerminalTask({ task, context, onSolved, onAttempt }: { task: TaskOf<'terminal'>; context: TaskContext; onSolved: () => void; onAttempt: () => void }) {
  const user = useSession()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'reset' | 'verify' | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [terminalKey, setTerminalKey] = useState(0)
  const folder = `${context.workspaceDir}/${task.workdir}`

  if (!user) {
    return (
      <Alert>
        <TerminalSquare />
        <AlertTitle>Übungs-Terminal</AlertTitle>
        <AlertDescription>
          <p>Für echte Terminal-Aufgaben brauchst du ein lokales Konto – so weiß Stacklab, welcher Fortschritt dir gehört.</p>
          <Button asChild size="sm" className="mt-2"><Link to="/anmelden">Anmelden</Link></Button>
        </AlertDescription>
      </Alert>
    )
  }

  const reset = async () => {
    setBusy('reset')
    setResult(null)
    try {
      const response = await Api.resetTask({ ...context.scope, task_id: task.id })
      if (response.ok) {
        toast.success('Aufgabe vorbereitet', { description: `Ordner workspace/${folder} ist bereit.` })
        setOpen(true)
        setTerminalKey((key) => key + 1)
      } else {
        toast.error('Vorbereitung fehlgeschlagen', { description: response.output.slice(0, 300) })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler')
    } finally {
      setBusy(null)
    }
  }

  const verify = async () => {
    setBusy('verify')
    onAttempt()
    try {
      const response = await Api.verifyTask({ ...context.scope, task_id: task.id })
      setResult(response)
      if (response.passed) onSolved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prüfung fehlgeschlagen')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
        <FolderOpen className="mt-0.5 size-4 shrink-0 text-brand" />
        <p>
          Arbeitsordner: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">workspace/{folder}</code>
          <span className="text-muted-foreground"> – du kannst ihn auch in deinem eigenen Editor öffnen.</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!open && (
          <Button onClick={() => setOpen(true)} variant="secondary">
            <Play /> Terminal öffnen
          </Button>
        )}
        <Button variant="outline" onClick={reset} disabled={busy !== null}>
          {busy === 'reset' ? <Spinner /> : <RotateCcw />} {task.setup ? 'Aufgabe vorbereiten / zurücksetzen' : 'Ordner anlegen / zurücksetzen'}
        </Button>
        <Button onClick={verify} disabled={busy !== null}>
          {busy === 'verify' ? <Spinner /> : <ShieldCheck />} Prüfen
        </Button>
      </div>
      {open && <RealTerminal key={terminalKey} courseSlug={context.courseSlug} startDir={task.workdir} />}
      {result && <CheckResults result={result} />}
    </div>
  )
}

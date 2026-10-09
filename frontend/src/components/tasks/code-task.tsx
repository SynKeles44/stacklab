import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CodeEditor } from '@/components/code/lazy'
import { ConsoleOutput } from '@/components/code/console-output'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import type { TaskOf } from '@/lib/content-schemas'
import { runJs } from '@/lib/runners/js-runner'
import { runReact } from '@/lib/runners/react-runner'
import type { LogLine, TestResult } from '@/lib/runners/types'
import type { TaskContext } from './task-renderer'

type Outcome = { passed: boolean; results: TestResult[]; logs?: LogLine[]; error?: string | null; output?: string | null }

const STORAGE = (key: string) => `stacklab.code.${key}`

export function CodeTask({
  task,
  context,
  onSolved,
  onAttempt,
  onCodeChange,
  examId,
}: {
  task: TaskOf<'code'>
  context: TaskContext
  onSolved: () => void
  onAttempt: () => void
  onCodeChange?: (code: string) => void
  examId?: number
}) {
  const storageKey = `${context.storagePrefix}.${task.id}`
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE(storageKey)) ?? task.starter ?? '')
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isReact = task.language === 'jsx' || task.language === 'tsx'

  useEffect(() => {
    localStorage.setItem(STORAGE(storageKey), code)
    onCodeChange?.(code)
  }, [code, storageKey, onCodeChange])

  const run = async () => {
    setRunning(true)
    onAttempt()
    try {
      let next: Outcome
      if (task.language === 'php') {
        if (!getToken()) {
          next = { passed: false, results: [], error: 'PHP-Aufgaben laufen im Übungs-Container – bitte melde dich an.' }
        } else {
          const response = await Api.runPhp({ scope: examId ? 'exam' : context.scope.scope, id: examId ?? context.scope.id, task_id: task.id, code })
          next = { passed: response.passed, results: response.results, output: response.output || null }
        }
      } else if (isReact && iframeRef.current) {
        const response = await runReact(iframeRef.current, code, task.language as 'jsx' | 'tsx', task.tests)
        next = { passed: response.ok && response.results.length > 0 && response.results.every((r) => r.passed), results: response.results, logs: response.logs, error: response.error }
      } else {
        const response = await runJs(code, task.language as 'js' | 'ts', task.tests)
        next = { passed: response.ok && response.results.length > 0 && response.results.every((r) => r.passed), results: response.results, logs: response.logs, error: response.error }
      }
      setOutcome(next)
      if (next.passed) onSolved()
    } catch (error) {
      setOutcome({ passed: false, results: [], error: error instanceof Error ? error.message : String(error) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3">
      <CodeEditor value={code} onChange={setCode} language={task.language} minHeight="200px" />
      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={running}>
          {running ? <Spinner /> : <Play />} Tests ausführen
        </Button>
        <Button variant="ghost" onClick={() => { setCode(task.starter ?? ''); setOutcome(null) }}>
          <RotateCcw /> Zurücksetzen
        </Button>
      </div>
      {isReact && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-muted px-3 py-1 text-xs text-muted-foreground">Vorschau</div>
          <iframe ref={iframeRef} title="Vorschau" src="/runner.html" sandbox="allow-scripts" className="h-48 w-full bg-white" />
        </div>
      )}
      {outcome && <ConsoleOutput results={outcome.results} logs={outcome.logs} error={outcome.error} output={outcome.output} />}
    </div>
  )
}

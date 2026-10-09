import { Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { runJs } from '@/lib/runners/js-runner'
import type { RunResult } from '@/lib/runners/types'
import { CodeEditor } from './lazy'
import { ConsoleOutput } from './console-output'

export function RunnableCode({ initial, language }: { initial: string; language: 'js' | 'ts' }) {
  const [code, setCode] = useState(initial)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setResult(await runJs(code, language, []))
    setRunning(false)
  }

  return (
    <div className="not-prose space-y-3 rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Probier es aus – {language === 'ts' ? 'TypeScript' : 'JavaScript'}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setCode(initial); setResult(null) }} aria-label="Code zurücksetzen">
            <RotateCcw />
          </Button>
          <Button size="sm" onClick={run} disabled={running}>
            {running ? <Spinner /> : <Play />} Ausführen
          </Button>
        </div>
      </div>
      <CodeEditor value={code} onChange={setCode} language={language} minHeight="80px" />
      {result && (
        <ConsoleOutput logs={result.logs} error={result.error} output={result.ok && result.logs.length === 0 ? '(keine Ausgabe – nutze console.log)' : null} />
      )}
    </div>
  )
}

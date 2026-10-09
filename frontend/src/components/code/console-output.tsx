import { CheckCircle2, XCircle } from 'lucide-react'
import type { LogLine, TestResult } from '@/lib/runners/types'
import { cn } from '@/lib/utils'

export function ConsoleOutput({ logs, error, results, output }: { logs?: LogLine[]; error?: string | null; results?: TestResult[]; output?: string | null }) {
  const empty = !logs?.length && !error && !results?.length && !output
  return (
    <div className="space-y-2">
      {results && results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((result) => (
            <li key={result.name} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', result.passed ? 'border-success/30 bg-success/8' : 'border-destructive/30 bg-destructive/8')}>
              {result.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
              <div className="min-w-0">
                <div className="font-medium">{result.name}</div>
                {!result.passed && result.message && <div className="mt-0.5 font-mono text-xs break-words text-muted-foreground">{result.message}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(!empty || results === undefined) && (logs?.length || error || output) ? (
        <pre className="max-h-64 overflow-auto rounded-lg bg-[oklch(0.19_0.03_285)] p-3 font-mono text-xs leading-relaxed text-white/85">
          {output && <div className="whitespace-pre-wrap">{output}</div>}
          {logs?.map((line, index) => (
            <div key={index} className={cn('whitespace-pre-wrap', line.level === 'error' && 'text-red-300', line.level === 'warn' && 'text-amber-300')}>
              {line.text}
            </div>
          ))}
          {error && <div className="whitespace-pre-wrap text-red-300">{error}</div>}
        </pre>
      ) : null}
    </div>
  )
}

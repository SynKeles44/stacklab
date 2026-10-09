import { CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import type { CheckResult } from '@/lib/api'
import { cn } from '@/lib/utils'

export function CheckResults({ result }: { result: CheckResult }) {
  return (
    <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5" aria-live="polite">
      {result.results.map((item, index) => (
        <li key={index} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', item.passed ? 'border-success/30 bg-success/8' : 'border-destructive/30 bg-destructive/8')}>
          {item.passed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />}
          <div className="min-w-0">
            <div>{item.message}</div>
            {!item.passed && item.output && <pre className="mt-1 max-h-32 overflow-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">{item.output}</pre>}
          </div>
        </li>
      ))}
    </motion.ul>
  )
}

import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { SimTerminal } from '@/components/code/lazy'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { TaskOf } from '@/lib/content-schemas'

export function SimulatedTask({ task, onSolved, onAttempt }: { task: TaskOf<'simulated'>; onSolved: () => void; onAttempt: () => void }) {
  const [step, setStep] = useState(0)
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={(step / task.steps.length) * 100} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground">
          Schritt {Math.min(step + 1, task.steps.length)} / {task.steps.length}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Simulation neu starten" onClick={() => { setStep(0); setResetKey((k) => k + 1) }}>
          <RotateCcw />
        </Button>
      </div>
      <SimTerminal
        task={task}
        resetKey={resetKey}
        onProgress={(next, done) => {
          setStep(next)
          onAttempt()
          if (done) onSolved()
        }}
      />
    </div>
  )
}

import { Binary, Code2, GitPullRequestArrow, ListOrdered, Map as MapIcon, MonitorPlay, MousePointerClick, TerminalSquare, Workflow } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import type { Task } from '@/lib/content-schemas'
import { CodeTask } from './code-task'
import { DiagramTask } from './diagram-task'
import { DragDropTask } from './dragdrop-task'
import { OrderTask } from './order-task'
import { RequestTask } from './request-task'
import { SimulatedTask } from './simulated-task'
import { StepsTask } from './steps-task'
import { TaskCard } from './task-card'
import { TerminalTask } from './terminal-task'

export type TaskContext = {
  scope: { scope: 'lesson' | 'module'; id: number }
  courseSlug: string
  workspaceDir: string
  storagePrefix: string
  /** Page that shows this task, used for bookmarks. */
  url?: string
}

const META: Record<Task['type'], { label: string; icon: typeof Binary }> = {
  terminal: { label: 'Übungs-Terminal', icon: TerminalSquare },
  simulated: { label: 'Terminal-Simulation', icon: MonitorPlay },
  code: { label: 'Code-Aufgabe', icon: Code2 },
  dragdrop: { label: 'Zuordnen', icon: MousePointerClick },
  order: { label: 'Reihenfolge', icon: ListOrdered },
  diagram: { label: 'Diagramm beschriften', icon: MapIcon },
  request: { label: 'Request bauen', icon: GitPullRequestArrow },
  steps: { label: 'Was passiert als Nächstes?', icon: Workflow },
}

export function TaskRenderer({ task, context, done: initiallyDone, onCompleted }: { task: Task; context: TaskContext; done: boolean; onCompleted?: (taskId: string) => void }) {
  const [done, setDone] = useState(initiallyDone)
  const [attempted, setAttempted] = useState(false)
  const meta = META[task.type]

  const onAttempt = useCallback(() => setAttempted(true), [])

  const onSolved = useCallback(async () => {
    const serverGraded = task.type === 'terminal' || (task.type === 'code' && task.language === 'php')
    setDone(true)
    onCompleted?.(task.id)
    if (!serverGraded && getToken()) {
      try {
        const result = await Api.completeTask({ ...context.scope, task_id: task.id })
        if (result.newly_completed) toast.success('Aufgabe gelöst!', { description: task.title })
      } catch {
        toast.error('Fortschritt konnte nicht gespeichert werden.')
      }
    } else if (!done) {
      toast.success('Aufgabe gelöst!', { description: task.title })
    }
  }, [task, context.scope, done, onCompleted])

  const body = (() => {
    switch (task.type) {
      case 'terminal':
        return <TerminalTask task={task} context={context} onSolved={onSolved} onAttempt={onAttempt} />
      case 'simulated':
        return <SimulatedTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
      case 'code':
        return <CodeTask task={task} context={context} onSolved={onSolved} onAttempt={onAttempt} />
      case 'dragdrop':
        return <DragDropTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
      case 'order':
        return <OrderTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
      case 'diagram':
        return <DiagramTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
      case 'request':
        return <RequestTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
      case 'steps':
        return <StepsTask task={task} onSolved={onSolved} onAttempt={onAttempt} />
    }
  })()

  return (
    <TaskCard
      task={task}
      icon={meta.icon}
      label={meta.label}
      done={done}
      attempted={attempted}
      bookmark={context.url ? { refKey: `${context.storagePrefix}.${task.id}`, url: `${context.url}#aufgabe-${task.id}` } : undefined}
    >
      {body}
    </TaskCard>
  )
}

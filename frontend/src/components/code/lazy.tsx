import { lazy, Suspense, type ComponentProps } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const CodeEditorImpl = lazy(() => import('./code-editor').then((module) => ({ default: module.CodeEditor })))
const RealTerminalImpl = lazy(() => import('@/components/terminal/real-terminal').then((module) => ({ default: module.RealTerminal })))
const SimTerminalImpl = lazy(() => import('@/components/terminal/sim-terminal').then((module) => ({ default: module.SimTerminal })))

/** Heavy editor/terminal bundles load on first use only. */
export function CodeEditor(props: ComponentProps<typeof CodeEditorImpl>) {
  return (
    <Suspense fallback={<Skeleton className="w-full rounded-xl" style={{ height: props.minHeight ?? '180px' }} />}>
      <CodeEditorImpl {...props} />
    </Suspense>
  )
}

export function RealTerminal(props: ComponentProps<typeof RealTerminalImpl>) {
  return (
    <Suspense fallback={<Skeleton className="h-[340px] w-full rounded-xl sm:h-[400px]" />}>
      <RealTerminalImpl {...props} />
    </Suspense>
  )
}

export function SimTerminal(props: ComponentProps<typeof SimTerminalImpl>) {
  return (
    <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl sm:h-[340px]" />}>
      <SimTerminalImpl {...props} />
    </Suspense>
  )
}

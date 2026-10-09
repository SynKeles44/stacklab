import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef } from 'react'
import { SimShell, type SimTask } from '@/lib/sim-shell'
import { cn } from '@/lib/utils'
import { XTERM_OPTIONS } from './xterm-theme'

const PROMPT_COLOR = '\u001b[1;32m'
const RESET = '\u001b[0m'

export function SimTerminal({ task, onProgress, resetKey, className }: { task: SimTask; onProgress: (step: number, done: boolean) => void; resetKey: number; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(onProgress)
  progressRef.current = onProgress

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const terminal = new Terminal(XTERM_OPTIONS)
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(host)
    fit.fit()

    const shell = new SimShell(task)
    const history: string[] = []
    let historyIndex = 0
    let line = ''

    const writePrompt = () => terminal.write(`${PROMPT_COLOR}${shell.prompt}${RESET} `)
    terminal.writeln('\u001b[36mSimuliertes Terminal\u001b[0m – Befehle werden nachgestellt, nicht wirklich ausgeführt. "tipp" hilft weiter.')
    terminal.writeln('')
    writePrompt()

    const replaceLine = (next: string) => {
      terminal.write('\b \b'.repeat(line.length))
      line = next
      terminal.write(line)
    }

    const disposable = terminal.onData((data) => {
      if (data === '\r') {
        terminal.write('\r\n')
        if (line.trim()) history.push(line)
        historyIndex = history.length
        const result = shell.run(line)
        line = ''
        if (result.output) terminal.write(`${result.output.replace(/\r?\n/g, '\r\n').replace(/\r\n$/, '')}\r\n`)
        if (result.advanced) progressRef.current(shell.step, result.done)
        if (result.done && result.advanced) terminal.writeln('\u001b[1;32m✔ Alle Schritte geschafft!\u001b[0m')
        writePrompt()
      } else if (data === '\u007f') {
        if (line.length > 0) {
          line = line.slice(0, -1)
          terminal.write('\b \b')
        }
      } else if (data === '\u001b[A') {
        if (historyIndex > 0) replaceLine(history[--historyIndex] ?? '')
      } else if (data === '\u001b[B') {
        if (historyIndex < history.length) {
          historyIndex++
          replaceLine(history[historyIndex] ?? '')
        }
      } else if (data === '\u0003') {
        terminal.write('^C\r\n')
        line = ''
        writePrompt()
      } else if (data === '\u000c') {
        terminal.clear()
      } else if (!data.startsWith('\u001b')) {
        const printable = data.replace(/[\u0000-\u001f]/g, '')
        line += printable
        terminal.write(printable)
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch {
        // hidden
      }
    })
    resizeObserver.observe(host)

    return () => {
      disposable.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
    }
  }, [task, resetKey])

  return (
    <div className={cn('overflow-hidden rounded-xl border border-white/10 bg-[#15132a]', className)}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-xs text-white/60">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span>Simulation</span>
      </div>
      <div ref={hostRef} className="h-[300px] sm:h-[340px]" />
    </div>
  )
}

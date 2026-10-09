import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Terminal } from '@xterm/xterm'
import { PlugZap, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { XTERM_OPTIONS } from './xterm-theme'

type Status = 'connecting' | 'open' | 'closed' | 'error'

export function RealTerminal({ courseSlug, startDir, className }: { courseSlug: string; startDir?: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('connecting')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reconnect = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    const terminal = new Terminal(XTERM_OPTIONS)
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.loadAddon(new WebLinksAddon())
    terminal.open(host)
    fit.fit()
    setStatus('connecting')
    setMessage(null)

    let socket: WebSocket | null = null
    const send = (payload: object) => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify(payload))

    const resizeObserver = new ResizeObserver(() => {
      try {
        fit.fit()
        send({ type: 'resize', cols: terminal.cols, rows: terminal.rows })
      } catch {
        // terminal not visible yet
      }
    })
    resizeObserver.observe(host)

    Api.terminalSession(courseSlug)
      .then(({ token, url }) => {
        if (disposed) return
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
        const params = new URLSearchParams({ token, cols: String(terminal.cols), rows: String(terminal.rows) })
        if (startDir) params.set('cwd', startDir)
        socket = new WebSocket(`${protocol}://${window.location.host}${url}?${params}`)
        socket.onopen = () => {
          setStatus('open')
          terminal.focus()
        }
        socket.onmessage = (event) => {
          const data = JSON.parse(String(event.data)) as { type: string; data?: string; message?: string }
          if (data.type === 'output' && data.data) terminal.write(data.data)
          if (data.type === 'error') setMessage(data.message ?? 'Fehler')
        }
        socket.onclose = () => !disposed && setStatus((current) => (current === 'error' ? current : 'closed'))
        socket.onerror = () => {
          setStatus('error')
          setMessage('Keine Verbindung zum Übungs-Terminal. Läuft der Container "sandbox"? (make logs)')
        }
        terminal.onData((data) => send({ type: 'input', data }))
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Terminal-Sitzung konnte nicht gestartet werden.')
      })

    return () => {
      disposed = true
      resizeObserver.disconnect()
      socket?.close()
      terminal.dispose()
    }
  }, [courseSlug, startDir, attempt])

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-white/10 bg-[#15132a]', className)}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-xs text-white/60">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="truncate font-mono">workspace/{startDir ?? ''}</span>
        <span className={cn('ml-auto flex items-center gap-1.5', status === 'open' ? 'text-emerald-300' : status === 'connecting' ? 'text-amber-300' : 'text-red-300')}>
          <span className="size-1.5 rounded-full bg-current" />
          {status === 'open' ? 'verbunden' : status === 'connecting' ? 'verbinde …' : 'getrennt'}
        </span>
        {status !== 'open' && status !== 'connecting' && (
          <Button size="icon-xs" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={reconnect} aria-label="Neu verbinden">
            <RefreshCw />
          </Button>
        )}
      </div>
      <div ref={hostRef} className="h-[340px] sm:h-[400px]" />
      {message && (
        <div className="absolute inset-x-3 bottom-3 flex items-start gap-2 rounded-lg bg-red-500/15 p-3 text-sm text-red-100 backdrop-blur">
          <PlugZap className="mt-0.5 size-4 shrink-0" /> {message}
        </div>
      )}
    </div>
  )
}

import { CheckCircle2, Plus, Send, Trash2, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { TaskOf } from '@/lib/content-schemas'
import { cn } from '@/lib/utils'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

type Header = { name: string; value: string }

export function evaluateRequest(task: TaskOf<'request'>, request: { method: string; path: string; headers: Header[]; body: string }): string[] {
  const problems: string[] = []
  const expected = task.expected
  if (request.method !== expected.method.toUpperCase()) problems.push(`Die Methode passt nicht zur Aufgabe (du hast ${request.method} gewählt).`)
  if (!new RegExp(expected.path).test(request.path)) problems.push(`Der Pfad "${request.path || '(leer)'}" ist nicht der richtige Endpunkt.`)
  for (const [name, pattern] of Object.entries(expected.headers ?? {})) {
    const header = request.headers.find((h) => h.name.trim().toLowerCase() === name.toLowerCase())
    if (!header) problems.push(`Der Header "${name}" fehlt.`)
    else if (!new RegExp(pattern, 'i').test(header.value.trim())) problems.push(`Der Header "${name}" hat einen unpassenden Wert.`)
  }
  for (const part of expected.body_contains ?? []) {
    if (!request.body.includes(part)) problems.push(`Im Body fehlt noch: ${part}`)
  }
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim().startsWith('{')) {
    try {
      JSON.parse(request.body)
    } catch {
      problems.push('Der Body ist kein gültiges JSON (Anführungszeichen? Kommas?).')
    }
  }
  return problems
}

export function RequestTask({ task, onSolved, onAttempt }: { task: TaskOf<'request'>; onSolved: () => void; onAttempt: () => void }) {
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/')
  const [headers, setHeaders] = useState<Header[]>([{ name: 'Accept', value: 'application/json' }])
  const [body, setBody] = useState('')
  const [problems, setProblems] = useState<string[] | null>(null)

  const send = () => {
    onAttempt()
    const found = evaluateRequest(task, { method, path, headers, body })
    setProblems(found)
    if (found.length === 0) onSolved()
  }

  const preview = `${method} ${path} HTTP/1.1\nHost: ${new URL(task.base_url ?? 'https://api.example.com').host}\n${headers.filter((h) => h.name).map((h) => `${h.name}: ${h.value}`).join('\n')}${body ? `\n\n${body}` : ''}`

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1.5">
          <Label>Methode</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-full font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${task.id}-path`}>Pfad</Label>
          <div className="flex items-center rounded-lg border bg-muted/40 pl-3 font-mono text-sm">
            <span className="truncate text-muted-foreground">{task.base_url ?? 'https://api.example.com'}</span>
            <Input id={`${task.id}-path`} value={path} onChange={(e) => setPath(e.target.value)} className="border-0 bg-transparent font-mono shadow-none focus-visible:ring-0" autoCapitalize="off" spellCheck={false} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Header</Label>
        {headers.map((header, index) => (
          <div key={index} className="flex gap-2">
            <Input aria-label="Header-Name" placeholder="Name" value={header.name} onChange={(e) => setHeaders(headers.map((h, i) => (i === index ? { ...h, name: e.target.value } : h)))} className="font-mono" autoCapitalize="off" />
            <Input aria-label="Header-Wert" placeholder="Wert" value={header.value} onChange={(e) => setHeaders(headers.map((h, i) => (i === index ? { ...h, value: e.target.value } : h)))} className="font-mono" autoCapitalize="off" />
            <Button variant="ghost" size="icon" aria-label="Header entfernen" onClick={() => setHeaders(headers.filter((_, i) => i !== index))}><Trash2 /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setHeaders([...headers, { name: '', value: '' }])}><Plus /> Header hinzufügen</Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${task.id}-body`}>Body</Label>
        <Textarea id={`${task.id}-body`} value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"name": "Ada"}' className="min-h-24 font-mono text-sm" spellCheck={false} />
      </div>

      <Collapsible className="rounded-lg border bg-muted/30 p-3 text-sm">
        <CollapsibleTrigger className="cursor-pointer font-medium">So sieht deine Anfrage „auf der Leitung“ aus</CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap">{preview}</pre>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={send}><Send /> Anfrage senden</Button>

      {problems && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-xl border p-4', problems.length === 0 ? 'border-success/40 bg-success/8' : 'border-destructive/40 bg-destructive/8')}>
          {problems.length === 0 ? (
            <>
              <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-success" /> Antwort vom Server</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-[oklch(0.19_0.03_285)] p-3 font-mono text-xs text-white/90">
                {`HTTP/1.1 ${task.response?.status ?? 200}\nContent-Type: application/json\n\n${task.response?.body ?? '{"ok": true}'}`}
              </pre>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-semibold"><XCircle className="size-5 text-destructive" /> Der Server versteht die Anfrage so noch nicht</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}

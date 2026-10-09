import { Check, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  php: 'PHP', bash: 'Terminal', sh: 'Terminal', shell: 'Terminal', zsh: 'Terminal', json: 'JSON', yaml: 'YAML', yml: 'YAML',
  html: 'HTML', css: 'CSS', sql: 'SQL', nginx: 'Nginx', dockerfile: 'Dockerfile', ini: 'INI', text: 'Text', http: 'HTTP',
  diff: 'Diff', xml: 'XML', toml: 'TOML', makefile: 'Makefile', blade: 'Blade', env: '.env', regex: 'Regex', graphql: 'GraphQL',
}

export function CodeBlock({ language, title, raw, children }: { language: string | null; title?: string | null; raw: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw.replace(/\n$/, ''))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const label = title ?? (language ? (LANGUAGE_LABELS[language] ?? language) : null)

  return (
    <div className="group not-prose relative overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.19_0.03_285)] text-[0.875rem] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
        <span className="text-xs font-medium text-white/60">{label}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('text-white/60 hover:bg-white/10 hover:text-white', copied && 'text-emerald-400')}
          onClick={copy}
          aria-label="Code kopieren"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 leading-relaxed [-webkit-overflow-scrolling:touch]">
        <code className="hljs font-mono">{children}</code>
      </pre>
    </div>
  )
}

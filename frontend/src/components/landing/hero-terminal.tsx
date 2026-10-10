import { Check, RotateCcw } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useInView } from '@/lib/use-in-view'
import { cn } from '@/lib/utils'

type Line = { kind: 'command'; text: string } | { kind: 'output'; text: string }

const SCRIPT: Line[] = [
  { kind: 'command', text: 'git init' },
  { kind: 'output', text: 'Initialized empty Git repository in /workspace/git/portfolio/.git/' },
  { kind: 'command', text: 'echo "# Portfolio" > README.md' },
  { kind: 'command', text: 'git add README.md' },
  { kind: 'command', text: 'git commit -m "docs: add readme"' },
  { kind: 'output', text: '[main (root-commit) 3f2c1a9] docs: add readme' },
  { kind: 'output', text: ' 1 file changed, 1 insertion(+)' },
]

const CHECKS = ['Repository angelegt', 'Genau ein Commit vorhanden', 'README.md ist committet']

const TYPE_MS = 26
const PAUSE_MS = 300

function timeline() {
  const events: { at: number; line: number; chars: number }[] = []
  let at = 350
  SCRIPT.forEach((line, index) => {
    if (line.kind === 'command') {
      for (let c = 1; c <= line.text.length; c++) {
        at += TYPE_MS
        events.push({ at, line: index, chars: c })
      }
      at += PAUSE_MS
    } else {
      at += 120
      events.push({ at, line: index, chars: line.text.length })
    }
  })
  return { events, end: at }
}

const { events, end } = timeline()

export function HeroTerminal() {
  const reduceMotion = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>('0px')
  const [run, setRun] = useState(0)
  const [cursor, setCursor] = useState<{ line: number; chars: number }>({ line: -1, chars: 0 })
  const [checks, setChecks] = useState(0)
  const instant = reduceMotion === true

  useEffect(() => {
    if (instant) {
      setCursor({ line: SCRIPT.length - 1, chars: SCRIPT.at(-1)!.text.length })
      setChecks(CHECKS.length)
      return
    }
    if (!inView) return
    setCursor({ line: -1, chars: 0 })
    setChecks(0)
    const timers = events.map((event) => window.setTimeout(() => setCursor({ line: event.line, chars: event.chars }), event.at))
    CHECKS.forEach((_, index) => timers.push(window.setTimeout(() => setChecks(index + 1), end + 350 + index * 260)))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [inView, instant, run])

  const finished = checks === CHECKS.length
  const typingLine = cursor.line >= 0 && SCRIPT[cursor.line]?.kind === 'command' && cursor.chars < SCRIPT[cursor.line]!.text.length ? cursor.line : -1
  const idleCaret = !finished && typingLine === -1

  return (
    <div ref={ref} className="relative">
      <div className="overflow-hidden rounded-xl bg-[var(--code)] text-[0.8125rem] leading-relaxed text-white/85 shadow-raised ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/[0.14]" />
            <span className="size-2.5 rounded-full bg-white/[0.14]" />
            <span className="size-2.5 rounded-full bg-white/[0.14]" />
          </div>
          <span className="truncate font-mono text-xs text-white/45">~/workspace/git/portfolio</span>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.6875rem] text-white/55 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-400" /> Übungs-Terminal
          </span>
        </div>

        <p className="sr-only">
          Beispiel: Im Übungs-Terminal legst du ein Git-Repository an und committest eine README. Stacklab prüft danach, ob das Repository, genau ein Commit und
          die README vorhanden sind.
        </p>

        <div aria-hidden className="grid px-4 py-4 font-mono">
          <div className="invisible [grid-area:1/1]">
            {SCRIPT.map((line, index) => (
              <ScriptLine key={index} line={line} typed={line.text.length} />
            ))}
            <PromptLine />
          </div>
          <div className="[grid-area:1/1]">
            {SCRIPT.slice(0, cursor.line + 1).map((line, index) => (
              <ScriptLine key={index} line={line} typed={index === cursor.line ? cursor.chars : line.text.length} caret={index === typingLine} />
            ))}
            {idleCaret && <PromptLine caret />}
          </div>
        </div>

        <div aria-hidden className="border-t border-white/[0.07] bg-white/[0.025] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/50">Stacklab prüft deinen Workspace</p>
            <span className={cn('font-mono text-[0.6875rem] text-white/40 transition-opacity duration-300', checks === 0 && 'opacity-0')}>
              {checks}/{CHECKS.length}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {CHECKS.map((check, index) => (
              <li
                key={check}
                className={cn(
                  'flex items-center gap-2 text-[0.8125rem] transition-[opacity,transform] duration-300 ease-out-strong',
                  index < checks ? 'translate-y-0 text-emerald-300 opacity-100' : 'translate-y-1 text-white/40 opacity-0',
                )}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-emerald-400/15">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {check}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!instant && (
        <button
          type="button"
          onClick={() => setRun((value) => value + 1)}
          className={cn(
            'absolute -bottom-9 right-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-[opacity,color] duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
            finished ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          tabIndex={finished ? 0 : -1}
        >
          <RotateCcw className="size-3" /> Noch mal abspielen
        </button>
      )}
    </div>
  )
}

function Prompt() {
  return (
    <>
      <span className="text-emerald-300/90">du@stacklab</span>
      <span className="text-white/35">:~/portfolio$ </span>
    </>
  )
}

function ScriptLine({ line, typed, caret = false }: { line: Line; typed: number; caret?: boolean }) {
  if (line.kind === 'output') return <p className="break-all whitespace-pre-wrap text-white/45">{line.text}</p>
  return (
    <p className="break-all whitespace-pre-wrap">
      <Prompt />
      <span className="text-white/90">{line.text.slice(0, typed)}</span>
      {caret && <Caret />}
    </p>
  )
}

function PromptLine({ caret = false }: { caret?: boolean }) {
  return (
    <p>
      <Prompt />
      {caret && <Caret />}
    </p>
  )
}

function Caret() {
  return <span className="caret inline-block h-[1.1em] w-[0.5em] translate-y-[0.15em] bg-white/70" />
}

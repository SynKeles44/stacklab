import { ArrowLeft, Wand2, CheckCircle2, ChevronDown, Circle, FolderOpen, Lightbulb, ListChecks, Play, RotateCcw, ScrollText, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { toast } from 'sonner'
import { CourseIcon } from '@/components/common/course-icon'
import { SmallMarkdown } from '@/components/tasks/task-card'
import { CheckResults } from '@/components/tasks/check-results'
import { RealTerminal } from '@/components/code/lazy'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Api, type CheckResult, type Project } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { celebrateBig } from '@/lib/celebrate'
import { cn } from '@/lib/utils'

type ProjectData = { project: Project; completed_steps: string[] }

export function ProjectPage() {
  const data = useLoaderData() as ProjectData
  const { project } = data
  const user = useSession()
  const [completed, setCompleted] = useState<string[]>(data.completed_steps)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const activeIndex = project.steps.findIndex((step) => !completed.includes(step.id))
  const workdir = project.workdir ?? project.steps[0]?.workdir ?? 'projekt'
  const [resetting, setResetting] = useState(false)
  const [terminalKey, setTerminalKey] = useState(0)

  const resetProject = async () => {
    setResetting(true)
    try {
      const result = await Api.resetProject(project.id)
      if (result.ok) {
        toast.success('Projekt vorbereitet', { description: `Ordner workspace/${project.course.workspace_dir}/${workdir} ist bereit.` })
        setTerminalOpen(true)
        setTerminalKey((key) => key + 1)
      } else {
        toast.error('Vorbereitung fehlgeschlagen', { description: result.output.slice(0, 300) })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler')
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    document.title = `${project.title} · Projekt · Stacklab`
  }, [project.title])

  const onStepDone = (id: string) => {
    const next = completed.includes(id) ? completed : [...completed, id]
    setCompleted(next)
    if (next.length === project.steps.length) {
      celebrateBig()
      toast.success('Projekt fertig gebaut!', { description: 'Alles liegt jetzt als echtes Projekt in deinem Workspace.' })
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to={`/kurse/${project.course.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {project.course.title}
      </Link>
      <header className="mt-4 flex items-start gap-4">
        <CourseIcon icon={project.course.icon} color={project.course.color} size="lg" />
        <div>
          <p className="eyebrow">Begleitetes Projekt</p>
          <h1 className="page-title mt-2">{project.title}</h1>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        <SmallMarkdown text={project.description} />
        {project.goal && (
          <div className="rounded-xl bg-card p-4 text-sm shadow-card">
            <p className="font-semibold">Das hast du am Ende</p>
            <SmallMarkdown text={project.goal} className="text-sm" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Progress value={(completed.length / project.steps.length) * 100} className="h-2" />
          <span className="text-sm tabular-nums text-muted-foreground">{completed.length} / {project.steps.length}</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <FolderOpen className="mt-0.5 size-4 shrink-0 text-brand" />
          <p>Projektordner: <code className="font-mono text-xs">workspace/{project.course.workspace_dir}/{workdir}</code> – öffne ihn gern parallel in deinem Editor.</p>
        </div>
        {user && project.has_setup && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={resetting}>{resetting ? <Spinner /> : <RotateCcw />} Projekt vorbereiten / zurücksetzen</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Projekt vorbereiten?</AlertDialogTitle>
                <AlertDialogDescription>
                  Der Ordner workspace/{project.course.workspace_dir}/{workdir} wird neu angelegt. Was du darin bisher gebaut hast, wird gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={resetProject}>Vorbereiten</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {user && (
          <div>
            {!terminalOpen ? (
              <Button variant="secondary" onClick={() => setTerminalOpen(true)}><Play /> Übungs-Terminal öffnen</Button>
            ) : (
              <RealTerminal key={terminalKey} courseSlug={project.course.slug} startDir={workdir} label={`${project.course.workspace_dir}/${workdir}`} />
            )}
          </div>
        )}
      </div>

      <ol className="mt-10 space-y-4">
        {project.steps.map((step, index) => (
          <ProjectStep
            key={step.id}
            index={index}
            step={step}
            projectId={project.id}
            done={completed.includes(step.id)}
            active={index === activeIndex}
            loggedIn={Boolean(user)}
            onDone={() => onStepDone(step.id)}
            onReopen={() => setCompleted((previous) => previous.filter((id) => id !== step.id))}
          />
        ))}
      </ol>
    </div>
  )
}

function ProjectStep({ index, step, projectId, done, active, loggedIn, onDone, onReopen }: {
  index: number
  step: Project['steps'][number]
  projectId: number
  done: boolean
  active: boolean
  loggedIn: boolean
  onDone: () => void
  onReopen: () => void
}) {
  const [open, setOpen] = useState(active)
  const [checklist, setChecklist] = useState<boolean[]>(() => (step.checklist ?? []).map(() => done))
  const [hints, setHints] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [solveOutput, setSolveOutput] = useState<string | null>(null)
  const hasChecks = (step.checks?.length ?? 0) > 0
  const checklistDone = checklist.every(Boolean)

  const verify = async () => {
    setBusy(true)
    try {
      const response = await Api.verifyProjectStep(projectId, step.id)
      setResult(response.results.length ? response : null)
      if (response.passed) onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prüfung fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const solve = async () => {
    setBusy(true)
    try {
      const response = await Api.solveProjectStep(projectId, step.id)
      setResult(response.results.length ? response : null)
      setSolveOutput(response.output || null)
      if (response.passed) {
        setChecklist((previous) => previous.map(() => true))
        onDone()
        toast.success('Schritt erledigt')
      } else {
        toast.error('Die Lösung ließ sich nicht vollständig automatisch ausführen. Sieh dir die Ausgabe an.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ausführen fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li>
      <Card className={cn('overflow-hidden transition-colors', done && 'border-success/40', active && !done && 'border-brand/50 shadow-md')}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center gap-3">
              {done ? <CheckCircle2 className="size-6 shrink-0 text-success" /> : <Circle className={cn('size-6 shrink-0', active ? 'text-brand' : 'text-muted-foreground/40')} />}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Schritt {index + 1}</p>
                <p className="font-semibold">{step.title}</p>
              </div>
              <ChevronDown className={cn('size-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <SmallMarkdown text={step.description} />
              {(step.checklist?.length ?? 0) > 0 && (
                <div className="rounded-xl border p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4 text-brand" /> Checkliste</p>
                  <ul className="space-y-2">
                    {step.checklist!.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Checkbox id={`${step.id}-${i}`} checked={checklist[i]} onCheckedChange={(value) => setChecklist((previous) => previous.map((v, j) => (j === i ? Boolean(value) : v)))} className="mt-0.5" />
                        <label htmlFor={`${step.id}-${i}`} className={cn('cursor-pointer', checklist[i] && 'text-muted-foreground line-through')}>{item}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hints > 0 && (
                <ul className="space-y-2">
                  {(step.hints ?? []).slice(0, hints).map((hint, i) => (
                    <motion.li key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" /> <SmallMarkdown text={hint} className="text-sm" />
                    </motion.li>
                  ))}
                </ul>
              )}
              {result && <CheckResults result={result} />}
              {solveOutput && (
                <pre className="max-h-60 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap">{solveOutput}</pre>
              )}
              <div className="flex flex-wrap gap-2">
                {!done && loggedIn && (
                  <Button onClick={verify} disabled={busy || (!hasChecks && !checklistDone)}>
                    {busy ? <Spinner /> : <ShieldCheck />} {hasChecks ? 'Schritt prüfen' : 'Als erledigt markieren'}
                  </Button>
                )}
                {!loggedIn && <Button asChild><Link to="/anmelden">Anmelden, um Fortschritt zu speichern</Link></Button>}
                {(step.hints?.length ?? 0) > hints && (
                  <Button variant="outline" onClick={() => setHints(hints + 1)}><Lightbulb /> Tipp</Button>
                )}
                {!done && loggedIn && step.can_solve && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" disabled={busy}><Wand2 /> Für mich erledigen</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Schritt automatisch erledigen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Stacklab führt die Befehle aus dem Lösungsweg im Übungs-Terminal für dich aus und prüft den Schritt danach. Am meisten lernst du, wenn du es
                          selbst versuchst – nutze das, wenn du feststeckst oder schnell weiterkommen willst.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Selbst versuchen</AlertDialogCancel>
                        <AlertDialogAction onClick={solve}>Erledigen</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {done && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await Api.reopenProjectStep(projectId, step.id).catch(() => undefined)
                      onReopen()
                    }}
                  >
                    <RotateCcw /> Wieder öffnen
                  </Button>
                )}
              </div>
              {step.solution && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground"><ScrollText /> Lösungsweg anzeigen</Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 rounded-lg border bg-muted/40 p-4">
                    <SmallMarkdown text={step.solution} className="text-sm" />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </li>
  )
}

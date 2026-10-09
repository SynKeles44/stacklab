import { ArrowRight, Award, BookA, BookOpen, CheckCircle2, Flame, GraduationCap, Library, ListChecks, MonitorPlay, MousePointerClick, Search, Sparkles, TerminalSquare } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useLoaderData } from 'react-router'
import { LogoMark } from '@/components/brand/logo'
import { CourseCard } from '@/components/common/course-card'
import { CourseIcon } from '@/components/common/course-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CourseSummary, Dashboard } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/format'
import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { courses, dashboard } = useLoaderData() as { courses: CourseSummary[]; dashboard: Dashboard | null }
  const user = useSession()

  useEffect(() => {
    document.title = 'Stacklab – IT lernen durch echtes Tippen'
  }, [])

  if (user && dashboard) return <DashboardView dashboard={dashboard} courses={courses} name={user.name} />
  return <Landing courses={courses} />
}

function Landing({ courses }: { courses: CourseSummary[] }) {
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)
  const featured = courses.slice(0, 6)

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border bg-card shadow-lg">
            <LogoMark className="h-9" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            IT lernen durch <span className="text-gradient">echtes Tippen</span>.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Von „Was ist eine Variable?“ bis zum eigenen Projekt auf AWS Fargate: {courses.length} Kurse, {totalLessons} Lektionen, ein echtes Übungs-Terminal und alles lokal auf deinem Rechner.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link to="/registrieren">Kostenlos loslegen <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
              <Link to="/kurse">Lernpfad ansehen</Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-sm text-muted-foreground">Open Source · läuft komplett lokal · kein Tracking</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: TerminalSquare, title: 'Echtes Terminal', text: 'Git, npm, Composer, Artisan: Du tippst echte Befehle, Stacklab prüft den echten Zustand auf deiner Festplatte.' },
            { icon: BookA, title: 'Jedes Wort erklärt', text: 'Jeder Fachbegriff ist anklickbar. Beim Lesen schaltest du dein persönliches Lexikon frei.' },
            { icon: MousePointerClick, title: 'Interaktiv statt Text', text: 'Code im Browser, Drag & Drop, Requests bauen, Diagramme beschriften – in jeder Lektion.' },
            { icon: Award, title: 'Projekte & Prüfungen', text: 'Pro Kurs ein echtes Projekt, eine Abschlussprüfung mit Schwächenanalyse und ein Zertifikat.' },
          ].map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
              <Card className="h-full">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand/12 text-brand"><feature.icon className="size-5" /></span>
                  <CardTitle className="mt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{feature.text}</CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Ein Pfad, sechs Etappen</h2>
              <p className="mt-2 text-muted-foreground">Von den Grundlagen bis zum Capstone-Projekt.</p>
            </div>
            <Button asChild variant="outline"><Link to="/kurse">Alle Kurse <ArrowRight /></Link></Button>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_ORDER.map((category, index) => {
              const count = courses.filter((course) => course.category === category).length
              return (
                <li key={category} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-2 to-brand font-bold text-white">{index + 1}</span>
                  <div>
                    <p className="font-semibold">{CATEGORY_LABELS[category]}</p>
                    <p className="text-sm text-muted-foreground">{count} Kurse</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Hier fängst du an</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => <CourseCard key={course.slug} course={course} />)}
        </div>
      </section>
    </>
  )
}

function DashboardView({ dashboard, courses, name }: { dashboard: Dashboard; courses: CourseSummary[]; name: string }) {
  const { stats } = dashboard
  const recommended = courses.find((course) => !course.progress || course.progress.completed === 0)
  const earned = dashboard.badges.filter((badge) => badge.earned).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Willkommen zurück</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hallo {name.split(' ')[0]}!</h1>
      </motion.header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2">
          <div className="absolute inset-0" style={{ background: `radial-gradient(80% 120% at 0% 0%, color-mix(in oklab, ${dashboard.continue?.color ?? 'var(--brand)'} 18%, transparent), transparent 70%)` }} />
          <CardContent className="relative flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
            {dashboard.continue ? (
              <>
                <CourseIcon icon={dashboard.continue.icon} color={dashboard.continue.color} size="lg" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Weiterlernen · {dashboard.continue.course_title}</p>
                  <p className="text-xl font-semibold">{dashboard.continue.lesson_title}</p>
                </div>
                <Button asChild size="lg">
                  <Link to={`/kurse/${dashboard.continue.course_slug}/${dashboard.continue.lesson_slug}`}>Fortsetzen <ArrowRight /></Link>
                </Button>
              </>
            ) : (
              <>
                <Sparkles className="size-10 text-brand" />
                <div className="flex-1">
                  <p className="text-xl font-semibold">Bereit für deine erste Lektion?</p>
                  <p className="text-sm text-muted-foreground">Starte mit {recommended?.title ?? 'dem ersten Kurs'} – Schritt für Schritt.</p>
                </div>
                {recommended && <Button asChild size="lg"><Link to={`/kurse/${recommended.slug}`}>Los geht’s <ArrowRight /></Link></Button>}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-6">
            <motion.span
              animate={stats.streak > 0 ? { scale: [1, 1.12, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className={cn('flex size-14 items-center justify-center rounded-2xl', stats.streak > 0 ? 'bg-orange-500/15 text-orange-500' : 'bg-muted text-muted-foreground')}
            >
              <Flame className="size-7" />
            </motion.span>
            <div>
              <p className="text-3xl font-bold tabular-nums">{stats.streak}</p>
              <p className="text-sm text-muted-foreground">{stats.streak === 1 ? 'Tag in Folge' : 'Tage in Folge'} gelernt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={BookOpen} label="Lektionen" value={stats.lessons_completed} total={stats.lessons_total} />
        <Stat icon={BookA} label="Begriffe" value={stats.terms_unlocked} total={stats.terms_total} link="/lexikon" />
        <Stat icon={ListChecks} label="Aufgaben gelöst" value={stats.tasks_completed} />
        <Stat icon={Award} label="Prüfungen bestanden" value={stats.exams_passed} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Deine Kurse</h2>
          {dashboard.active_courses.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">Noch kein Kurs begonnen. <Link to="/kurse" className="text-brand hover:underline">Zum Lernpfad</Link></p>
          ) : (
            <div className="space-y-3">
              {dashboard.active_courses.map((course) => (
                <Link key={course.slug} to={`/kurse/${course.slug}`} className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-brand/50">
                  <CourseIcon icon={course.icon} color={course.color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{course.title}</p>
                      <span className="text-sm tabular-nums text-muted-foreground">{course.progress.percent} %</span>
                    </div>
                    <Progress value={course.progress.percent} className="mt-2 h-1.5" />
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {course.next_lesson ? `Als Nächstes: ${course.next_lesson.title}` : <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3" /> Alle Lektionen geschafft</span>}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <h2 className="mt-10 mb-4 text-xl font-semibold">Aktivität der letzten 12 Wochen</h2>
          <ActivityGrid activity={dashboard.activity} />
        </section>

        <section>
          <h2 className="mb-4 flex items-center justify-between text-xl font-semibold">
            Abzeichen <span className="text-sm font-normal text-muted-foreground">{earned} / {dashboard.badges.length}</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {dashboard.badges.map((badge) => {
              const Icon = iconFor(badge.icon)
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className={cn('flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center', badge.earned ? 'bg-gradient-to-br from-brand/15 to-brand-2/15' : 'opacity-40 grayscale')}
                    >
                      <Icon className={cn('size-7', badge.earned ? 'text-brand' : 'text-muted-foreground')} />
                      <span className="text-[0.7rem] leading-tight font-medium">{badge.title}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>{badge.description}{badge.earned ? '' : ' (noch nicht erreicht)'}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
          <div className="mt-6 grid gap-2">
            <Button asChild variant="outline" className="justify-start"><Link to="/lexikon"><Library /> Mein Lexikon</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/suche"><Search /> Nachschlagen</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/kurse"><GraduationCap /> Alle Kurse</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/einstellungen"><MonitorPlay /> Übungs-Terminal & Workspace</Link></Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, total, link }: { icon: typeof BookOpen; label: string; value: number; total?: number; link?: string }) {
  const content = (
    <Card className="h-full transition-colors hover:border-brand/40">
      <CardContent className="py-5">
        <Icon className="size-5 text-brand" />
        <p className="mt-3 text-2xl font-bold tabular-nums">
          {value}
          {total !== undefined && <span className="text-base font-normal text-muted-foreground"> / {total}</span>}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {total !== undefined && total > 0 && <Progress value={(value / total) * 100} className="mt-3 h-1" />}
      </CardContent>
    </Card>
  )
  return link ? <Link to={link}>{content}</Link> : content
}

function ActivityGrid({ activity }: { activity: Dashboard['activity'] }) {
  const map = new Map(activity.map((day) => [day.day, day.actions]))
  const days = Array.from({ length: 84 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (83 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, actions: map.get(key) ?? 0, label: date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) }
  })
  const level = (actions: number) => (actions === 0 ? 0 : actions < 3 ? 1 : actions < 8 ? 2 : actions < 15 ? 3 : 4)
  const colors = ['bg-muted', 'bg-brand/25', 'bg-brand/45', 'bg-brand/70', 'bg-brand']

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-4">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {days.map((day) => (
          <Tooltip key={day.key}>
            <TooltipTrigger asChild>
              <span className={cn('size-3.5 rounded-[3px] sm:size-4', colors[level(day.actions)])} />
            </TooltipTrigger>
            <TooltipContent>{day.label}: {day.actions} Aktionen</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

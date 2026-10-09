import { ArrowRight, Award, BookA, BookOpen, ChevronRight, Flame, ListChecks } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLoaderData } from 'react-router'
import { CourseCard } from '@/components/common/course-card'
import { CourseIcon } from '@/components/common/course-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CourseSummary, Dashboard } from '@/lib/api'
import { useSession } from '@/lib/auth'
import { CATEGORY_LABELS, CATEGORY_ORDER, pluralize } from '@/lib/format'
import { iconFor } from '@/lib/icons'
import { useUiVariant } from '@/lib/ui-variant'
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

function TerminalPreview() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#15141a] font-mono text-[0.8rem] leading-relaxed text-white/85 shadow-raised">
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-xs text-white/40">workspace/git/erstes-repo</span>
      </div>
      <div className="space-y-1 p-4">
        <p><span className="text-emerald-300">du@stacklab</span><span className="text-white/40">:~/git/erstes-repo$</span> git init</p>
        <p className="text-white/50">Initialized empty Git repository in /workspace/git/erstes-repo/.git/</p>
        <p><span className="text-emerald-300">du@stacklab</span><span className="text-white/40">:~/git/erstes-repo$</span> git add README.md</p>
        <p><span className="text-emerald-300">du@stacklab</span><span className="text-white/40">:~/git/erstes-repo$</span> git commit -m "docs: add readme"</p>
        <p className="text-white/50">[main (root-commit) 3f2c1a9] docs: add readme</p>
      </div>
      <div className="border-t border-white/[0.08] bg-white/[0.03] px-4 py-3 font-sans text-[0.8rem]">
        <p className="text-white/50">Prüfung</p>
        <p className="mt-1 text-emerald-300">✓ Repository angelegt</p>
        <p className="text-emerald-300">✓ Genau ein Commit vorhanden</p>
        <p className="text-emerald-300">✓ README.md ist committet</p>
      </div>
    </div>
  )
}

function Landing({ courses }: { courses: CourseSummary[] }) {
  const variant = useUiVariant()
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)
  const starters = courses.slice(0, 6)

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-24">
        <div>
          <p className="text-sm font-medium text-primary">Open Source · läuft komplett lokal</p>
          <h1 className={cn('mt-3 tracking-tight', variant === 'apple' ? 'text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-6xl' : 'text-4xl font-semibold sm:text-5xl')}>
            IT lernen, indem du es wirklich tust.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            {pluralize(courses.length, 'Kurs', 'Kurse')} und {pluralize(totalLessons, 'Lektion', 'Lektionen')} von den Grundlagen bis zum
            Deployment. Du tippst echte Befehle, Stacklab prüft, was auf deiner Festplatte passiert ist.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-5 text-[0.95rem]">
              <Link to="/registrieren">Konto anlegen</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className={cn('h-11 px-5 text-[0.95rem]', variant === 'apple' && 'text-primary hover:bg-transparent hover:text-primary/80')}>
              <Link to="/kurse">Lernpfad ansehen <ArrowRight /></Link>
            </Button>
          </div>
        </div>
        <TerminalPreview />
      </section>

      <section className={cn(variant === 'apple' ? '' : 'border-y bg-card')}>
        <dl className="mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            ['Echtes Terminal', 'Git, npm, Composer, Artisan – in einem abgesicherten Container. Deine Projekte liegen im Workspace auf deiner Platte.'],
            ['Jedes Wort erklärt', 'Fachbegriffe sind anklickbar. Was du gelesen hast, landet in deinem persönlichen Lexikon.'],
            ['Üben statt lesen', 'Jede Lektion hat Aufgaben: Code im Browser, Requests bauen, Diagramme beschriften.'],
            ['Projekt & Prüfung', 'Pro Kurs ein begleitetes Projekt und eine Abschlussprüfung mit Auswertung pro Modul.'],
          ].map(([title, text]) => (
            <div key={title}>
              <dt className="font-medium">{title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={cn('tracking-tight', variant === 'apple' ? 'text-[1.75rem] font-bold' : 'text-2xl font-semibold')}>Der Lernpfad</h2>
            <p className="mt-1 text-muted-foreground">Sechs Etappen, in empfohlener Reihenfolge.</p>
          </div>
          <Button asChild variant="ghost" className={cn(variant === 'apple' && '-ml-1 px-1 text-primary hover:bg-transparent hover:text-primary/80')}><Link to="/kurse">Alle Kurse <ArrowRight /></Link></Button>
        </div>
        {variant === 'apple' ? (
          <ol className="grouped mt-6 max-w-2xl [--grouped-inset:3.75rem]">
            {CATEGORY_ORDER.map((category, index) => (
              <li key={category}>
                <Link to="/kurse" className="cell">
                  <span className="icon-tile bg-primary text-[0.9375rem] font-semibold tabular-nums">{index + 1}</span>
                  <span className="min-w-0 flex-1 text-[1.0625rem] leading-snug">{CATEGORY_LABELS[category]}</span>
                  <span className="text-[0.9375rem] text-muted-foreground">{pluralize(courses.filter((course) => course.category === category).length, 'Kurs', 'Kurse')}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_ORDER.map((category, index) => (
              <li key={category} className="flex items-baseline gap-3 border-b py-3">
                <span className="w-5 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                <span className="ml-auto text-sm text-muted-foreground">{pluralize(courses.filter((course) => course.category === category).length, 'Kurs', 'Kurse')}</span>
              </li>
            ))}
          </ol>
        )}

        <h2 className={cn('mt-14 tracking-tight', variant === 'apple' ? 'text-[1.75rem] font-bold' : 'text-2xl font-semibold')}>Hier fängst du an</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {starters.map((course) => <CourseCard key={course.slug} course={course} />)}
        </div>
      </section>
    </>
  )
}

function DashboardView({ dashboard, courses, name }: { dashboard: Dashboard; courses: CourseSummary[]; name: string }) {
  const variant = useUiVariant()
  const apple = variant === 'apple'
  const { stats } = dashboard
  const recommended = courses.find((course) => !course.progress || course.progress.completed === 0)
  const earned = dashboard.badges.filter((badge) => badge.earned)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className={cn('text-sm text-muted-foreground', apple && 'text-[0.8125rem] font-semibold uppercase')}>{new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
        <h1 className={cn(apple ? 'large-title' : 'text-3xl font-semibold tracking-tight')}>Hallo {name.split(' ')[0]}</h1>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {dashboard.continue ? (
              <>
                <CourseIcon icon={dashboard.continue.icon} color={dashboard.continue.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Weiterlernen · {dashboard.continue.course_title}</p>
                  <p className="truncate text-lg font-medium">{dashboard.continue.lesson_title}</p>
                </div>
                <Button asChild>
                  <Link to={`/kurse/${dashboard.continue.course_slug}/${dashboard.continue.lesson_slug}`}>Fortsetzen <ArrowRight /></Link>
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-lg font-medium">Bereit für die erste Lektion?</p>
                  <p className="text-sm text-muted-foreground">Empfohlen: {recommended?.title ?? 'der erste Kurs'}.</p>
                </div>
                {recommended && <Button asChild><Link to={`/kurse/${recommended.slug}`}>Starten <ArrowRight /></Link></Button>}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <Flame className={cn('size-7', stats.streak > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
            <div>
              <p className="text-2xl font-semibold tabular-nums">{stats.streak}</p>
              <p className="text-sm text-muted-foreground">{stats.streak === 1 ? 'Tag' : 'Tage'} in Folge gelernt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn('mt-4 grid grid-cols-2 lg:grid-cols-4', apple ? 'gap-3' : 'gap-4')}>
        <Stat apple={apple} icon={BookOpen} label="Lektionen" value={stats.lessons_completed} total={stats.lessons_total} />
        <Stat apple={apple} icon={BookA} label="Begriffe" value={stats.terms_unlocked} total={stats.terms_total} link="/lexikon" />
        <Stat apple={apple} icon={ListChecks} label="Aufgaben gelöst" value={stats.tasks_completed} />
        <Stat apple={apple} icon={Award} label="Prüfungen bestanden" value={stats.exams_passed} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <SectionTitle apple={apple}>Deine Kurse</SectionTitle>
          {dashboard.active_courses.length === 0 ? (
            <p className={cn('p-8 text-center text-muted-foreground', apple ? 'rounded-xl bg-card' : 'rounded-xl border border-dashed')}>
              Noch kein Kurs begonnen. <Link to="/kurse" className="text-primary hover:underline">Zum Lernpfad</Link>
            </p>
          ) : (
            <div className={cn(apple ? 'grouped [--grouped-inset:4rem]' : 'space-y-2')}>
              {dashboard.active_courses.map((course) => (
                <Link
                  key={course.slug}
                  to={`/kurse/${course.slug}`}
                  className={cn(apple ? 'cell gap-4 py-3' : 'pressable flex items-center gap-4 rounded-xl bg-card p-4 shadow-card transition-colors hover:shadow-raised')}
                >
                  <CourseIcon icon={course.icon} color={course.color} size="sm" solid={apple} className={cn(apple && 'rounded-[0.5rem]')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{course.title}</p>
                      <span className="text-sm text-muted-foreground tabular-nums">{course.progress.percent} %</span>
                    </div>
                    <Progress value={course.progress.percent} className="mt-2 h-1" />
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {course.next_lesson ? `Als Nächstes: ${course.next_lesson.title}` : 'Alle Lektionen geschafft'}
                    </p>
                  </div>
                  {apple && <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2.5} />}
                </Link>
              ))}
            </div>
          )}

          <SectionTitle apple={apple} className="mt-10">Letzte 12 Wochen</SectionTitle>
          <ActivityGrid activity={dashboard.activity} />
        </section>

        <section>
          <SectionTitle apple={apple}>
            Abzeichen <span className="ml-1 font-normal text-muted-foreground">{earned.length} / {dashboard.badges.length}</span>
          </SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {dashboard.badges.map((badge) => {
              const Icon = iconFor(badge.icon)
              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-xl bg-card shadow-card',
                        badge.earned ? 'text-foreground' : 'text-muted-foreground/35',
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-medium">{badge.title}</span> · {badge.description}
                    {badge.earned ? '' : ' (noch offen)'}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children, apple, className }: { children: React.ReactNode; apple: boolean; className?: string }) {
  return (
    <h2 className={cn(apple ? 'section-header' : 'mb-3 text-base font-semibold', className)}>
      {children}
    </h2>
  )
}

function Stat({ icon: Icon, label, value, total, link, apple }: { icon: typeof BookOpen; label: string; value: number; total?: number; link?: string; apple: boolean }) {
  const content = (
    <div className={cn('h-full p-4', apple ? 'rounded-xl bg-card' : 'rounded-xl bg-card shadow-card')}>
      <Icon className={cn('size-4', apple ? 'text-primary' : 'text-muted-foreground')} />
      <p className={cn('mt-3 text-2xl tabular-nums', apple ? 'font-bold tracking-tight' : 'font-semibold')}>
        {value}
        {total !== undefined && <span className="text-sm font-normal text-muted-foreground"> / {total}</span>}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
  return link ? <Link to={link} className="pressable">{content}</Link> : content
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
  const colors = ['bg-muted', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary']

  return (
    <div className="overflow-x-auto rounded-xl bg-card p-4 shadow-card">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {days.map((day) => (
          <Tooltip key={day.key}>
            <TooltipTrigger asChild>
              <span className={cn('size-3 rounded-[3px] sm:size-3.5', colors[level(day.actions)])} />
            </TooltipTrigger>
            <TooltipContent>{day.label}: {day.actions} Aktionen</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

import { ArrowRight, Award, BookA, BookOpen, Compass, Flame, ListChecks, Lock, Sparkles } from 'lucide-react'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CourseIcon } from '@/components/common/course-icon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CourseSummary, Dashboard as DashboardData, Term } from '@/lib/api'
import { CATEGORY_LABELS, CATEGORY_ORDER, pluralize } from '@/lib/format'
import { formatCount, loadGlossary } from '@/lib/glossary-cache'
import { iconFor } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function Dashboard({ dashboard, courses, name }: { dashboard: DashboardData; courses: CourseSummary[]; name: string }) {
  const { stats } = dashboard
  const firstName = name.split(' ')[0]
  const today = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const lessonPercent = stats.lessons_total ? Math.round((stats.lessons_completed / stats.lessons_total) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="page-title mt-3">Hallo {firstName}</h1>
          <p className="lead mt-2">
            {stats.lessons_completed === 0
              ? 'Schön, dass du da bist. Deine erste Lektion dauert nur ein paar Minuten.'
              : `Du hast ${pluralize(stats.lessons_completed, 'Lektion', 'Lektionen')} geschafft${lessonPercent >= 1 ? ` – ${lessonPercent} % des ganzen Lernpfads.` : '. Der Anfang ist gemacht.'}`}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <ContinueCard dashboard={dashboard} courses={courses} />
        <StreakCard streak={stats.streak} activity={dashboard.activity} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={BookOpen} label="Lektionen" value={stats.lessons_completed} total={stats.lessons_total} />
        <Stat icon={BookA} label="Begriffe" value={stats.terms_unlocked} total={stats.terms_total} link="/lexikon" />
        <Stat icon={ListChecks} label="Aufgaben gelöst" value={stats.tasks_completed} />
        <Stat icon={Award} label="Prüfungen bestanden" value={stats.exams_passed} />
      </dl>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section>
            <SectionTitle>Deine Kurse</SectionTitle>
            {dashboard.active_courses.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch kein Kurs begonnen.{' '}
                <Link to="/kurse" className="font-medium text-primary hover:underline">
                  Zum Lernpfad
                </Link>
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-xl bg-card shadow-card">
                {dashboard.active_courses.map((course) => (
                  <Link key={course.slug} to={`/kurse/${course.slug}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                    <CourseIcon icon={course.icon} color={course.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate font-medium">{course.title}</p>
                        <span className="numeric shrink-0 text-xs text-muted-foreground">
                          {course.progress.completed}/{course.progress.total}
                        </span>
                      </div>
                      <Progress value={course.progress.percent} className="mt-2 h-1" />
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">
                        {course.next_lesson ? `Als Nächstes: ${course.next_lesson.title}` : 'Alle Lektionen geschafft – bereit für die Prüfung'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle aside={<span className="text-xs text-muted-foreground">{totalActions(dashboard.activity)} Aktionen</span>}>Letzte 12 Wochen</SectionTitle>
            <ActivityGrid activity={dashboard.activity} />
          </section>

          <Discover dashboard={dashboard} courses={courses} />
        </div>

        <aside className="space-y-12">
          <RecentTerms unlocked={stats.terms_unlocked} total={stats.terms_total} />
          <Badges badges={dashboard.badges} />
        </aside>
      </div>
    </div>
  )
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold tracking-[-0.01em]">{children}</h2>
      {aside}
    </div>
  )
}

function ContinueCard({ dashboard, courses }: { dashboard: DashboardData; courses: CourseSummary[] }) {
  const next = dashboard.continue
  const active = next ? dashboard.active_courses.find((course) => course.slug === next.course_slug) : undefined
  const recommended = [...courses].sort((a, b) => a.position - b.position).find((course) => !course.progress || course.progress.completed === 0)
  const color = next?.color ?? recommended?.color ?? null

  return (
    <div
      style={{ '--course': color ?? 'var(--brand)' } as CSSProperties}
      className="course-wash relative flex flex-col justify-between gap-6 overflow-hidden rounded-xl bg-card p-5 shadow-card sm:p-6 lg:col-span-2"
    >
      {next ? (
        <>
          <div className="flex items-start gap-4">
            <CourseIcon icon={next.icon} color={next.color} />
            <div className="min-w-0">
              <p className="eyebrow">Weiterlernen</p>
              <p className="mt-2 text-sm text-muted-foreground">{next.course_title}</p>
              <p className="mt-0.5 text-xl leading-snug font-semibold tracking-[-0.015em] text-balance sm:text-2xl">{next.lesson_title}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {active && (
              <div className="flex flex-1 items-center gap-3">
                <Progress value={active.progress.percent} className="h-1.5 flex-1" />
                <span className="numeric text-xs text-muted-foreground">{active.progress.percent} % vom Kurs</span>
              </div>
            )}
            <Button asChild size="lg" className="h-10 px-4">
              <Link to={`/kurse/${next.course_slug}/${next.lesson_slug}`}>
                Fortsetzen <ArrowRight />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-4">
            {recommended && <CourseIcon icon={recommended.icon} color={recommended.color} />}
            <div>
              <p className="eyebrow">Dein Start</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.015em] sm:text-2xl">Bereit für die erste Lektion?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Empfohlen: {recommended?.title ?? 'der erste Kurs'} – {recommended?.subtitle ?? 'ohne Vorwissen'}
              </p>
            </div>
          </div>
          {recommended && (
            <Button asChild size="lg" className="h-10 w-fit px-4">
              <Link to={`/kurse/${recommended.slug}`}>
                Kurs ansehen <ArrowRight />
              </Link>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function StreakCard({ streak, activity }: { streak: number; activity: DashboardData['activity'] }) {
  const map = new Map(activity.map((day) => [day.day, day.actions]))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return {
      key: dayKey(date),
      active: (map.get(dayKey(date)) ?? 0) > 0,
      label: new Intl.DateTimeFormat('de-DE', { weekday: 'narrow' }).format(date),
      today: index === 6,
    }
  })

  return (
    <div className="flex flex-col justify-between gap-6 rounded-xl bg-card p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Serie</p>
          <p className="numeric mt-2 text-4xl font-semibold">{streak}</p>
          <p className="text-sm text-muted-foreground">{streak === 1 ? 'Tag' : 'Tage'} in Folge gelernt</p>
        </div>
        <span className={cn('flex size-10 items-center justify-center rounded-full', streak > 0 ? 'bg-spark/15 text-spark' : 'bg-muted text-muted-foreground')}>
          <Flame className="size-5" />
        </span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Die letzten sieben Tage">
        {days.map((day) => (
          <li key={day.key} className="flex flex-col items-center gap-1.5">
            <span
              aria-hidden
              className={cn('h-7 w-full rounded-md', day.active ? 'bg-spark' : 'bg-muted', day.today && !day.active && 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--border)]')}
            />
            <span aria-hidden className={cn('text-[0.6875rem] text-muted-foreground', day.today && 'font-semibold text-foreground')}>{day.label}</span>
            <span className="sr-only">{day.today ? 'Heute' : day.key}: {day.active ? 'gelernt' : 'nicht gelernt'}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Stat({ icon: Icon, label, value, total, link }: { icon: typeof BookOpen; label: string; value: number; total?: number; link?: string }) {
  const content = (
    <div className={cn('flex h-full flex-col rounded-xl bg-card p-4 shadow-card sm:p-5', link && 'transition-shadow hover:shadow-raised')}>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </dt>
      <dd className="mt-auto pt-3">
        <span className="numeric text-2xl font-semibold sm:text-3xl">{formatCount(value)}</span>
        {total !== undefined && <span className="numeric ml-1 text-sm text-muted-foreground">/ {formatCount(total)}</span>}
      </dd>
      {total !== undefined && total > 0 && <Progress value={(value / total) * 100} className="mt-3 h-1" />}
    </div>
  )
  return link ? (
    <Link to={link} className="pressable block">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  )
}

function totalActions(activity: DashboardData['activity']): string {
  return formatCount(activity.reduce((sum, day) => sum + day.actions, 0))
}

function ActivityGrid({ activity }: { activity: DashboardData['activity'] }) {
  const map = new Map(activity.map((day) => [day.day, day.actions]))
  const start = new Date()
  start.setDate(start.getDate() - 83)
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)
  const count = 84 + offset
  const days = Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = dayKey(date)
    return { key, date, actions: map.get(key) ?? 0, label: date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }) }
  })
  const weeks = Math.ceil(count / 7)
  const months = Array.from({ length: weeks }, (_, week) => {
    const first = days[week * 7]!.date
    const previous = week > 0 ? days[(week - 1) * 7]!.date : null
    return !previous || previous.getMonth() !== first.getMonth() ? first.toLocaleDateString('de-DE', { month: 'short' }) : ''
  })
  const level = (actions: number) => (actions === 0 ? 0 : actions < 3 ? 1 : actions < 8 ? 2 : actions < 15 ? 3 : 4)
  const colors = ['bg-muted', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary']

  const activeDays = days.filter((day) => day.actions > 0)
  const best = activeDays.reduce<(typeof days)[number] | null>((top, day) => (!top || day.actions > top.actions ? day : top), null)
  const weekday = new Map<number, number>()
  activeDays.forEach((day) => weekday.set(day.date.getDay(), (weekday.get(day.date.getDay()) ?? 0) + day.actions))
  const favourite = [...weekday.entries()].sort((a, b) => b[1] - a[1])[0]
  const favouriteLabel = favourite ? new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(days.find((day) => day.date.getDay() === favourite[0])!.date) : '–'

  return (
    <div className="flex flex-col gap-6 rounded-xl bg-card p-4 shadow-card sm:flex-row sm:items-stretch sm:p-5">
      <div className="no-scrollbar overflow-x-auto sm:shrink-0 sm:overflow-visible">
        <div className="w-max">
          <div className="grid gap-1 pl-7 text-[0.6875rem] text-muted-foreground" style={{ gridTemplateColumns: `repeat(${weeks}, 0.875rem)` }} aria-hidden>
            {months.map((month, index) => (
              <span key={index} className="whitespace-nowrap">{month}</span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1">
            <div className="grid w-6 grid-rows-7 gap-1 text-[0.625rem] leading-[0.875rem] text-muted-foreground" aria-hidden>
              {['Mo', '', 'Mi', '', 'Fr', '', ''].map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day) => (
                <Tooltip key={day.key}>
                  <TooltipTrigger asChild>
                    <span className={cn('size-3.5 rounded-[3px]', colors[level(day.actions)])} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {day.label}: {pluralize(day.actions, 'Aktion', 'Aktionen')}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 pl-7 text-[0.6875rem] text-muted-foreground" aria-hidden>
            weniger
            {colors.map((color) => (
              <span key={color} className={cn('size-2.5 rounded-[2px]', color)} />
            ))}
            mehr
          </div>
        </div>
      </div>
      <dl className="grid flex-1 grid-cols-3 gap-4 border-t pt-4 text-sm sm:grid-cols-1 sm:content-center sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <div>
          <dt className="text-xs text-muted-foreground">Aktive Tage</dt>
          <dd className="numeric mt-0.5 text-lg font-semibold">{activeDays.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Stärkster Tag</dt>
          <dd className="numeric mt-0.5 text-lg font-semibold">{best ? best.actions : 0}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lieblingstag</dt>
          <dd className="mt-0.5 truncate text-lg font-semibold">{favouriteLabel}</dd>
        </div>
      </dl>
    </div>
  )
}

function RecentTerms({ unlocked, total }: { unlocked: number; total: number }) {
  const [terms, setTerms] = useState<Term[] | null>(null)

  useEffect(() => {
    if (unlocked === 0) return
    let active = true
    loadGlossary(15_000)
      .then((glossary) => {
        if (!active) return
        const recent = glossary.terms
          .filter((term) => term.unlocked_at)
          .sort((a, b) => (b.unlocked_at ?? '').localeCompare(a.unlocked_at ?? ''))
          .slice(0, 6)
        setTerms(recent)
      })
      .catch(() => active && setTerms([]))
    return () => {
      active = false
    }
  }, [unlocked])

  const list = unlocked === 0 ? [] : terms

  return (
    <section>
      <SectionTitle
        aside={
          <Link to="/lexikon" className="text-xs font-medium text-primary hover:underline">
            Lexikon
          </Link>
        }
      >
        Zuletzt freigeschaltet
      </SectionTitle>
      <div className="rounded-xl bg-card p-2 shadow-card">
        {list === null ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex items-start gap-3 p-3 text-sm text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <p>Begriffe schaltest du frei, indem du Lektionen liest. {formatCount(total)} warten auf dich.</p>
          </div>
        ) : (
          <ul>
            {list.map((term) => (
              <li key={term.slug}>
                <Link to={`/lexikon/${term.slug}`} className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-spark" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{term.term}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{term.short}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

type Suggestion = { course: CourseSummary; reason: string }

function suggestions(dashboard: DashboardData, courses: CourseSummary[]): Suggestion[] {
  const ordered = [...courses].sort((a, b) => a.position - b.position)
  const isStarted = (course: CourseSummary) => Boolean(course.progress && course.progress.completed > 0) || dashboard.active_courses.some((active) => active.slug === course.slug)
  const started = ordered.filter(isStarted)
  const fresh = ordered.filter((course) => !isStarted(course))
  const result: Suggestion[] = []
  const add = (course: CourseSummary | undefined, reason: string) => {
    if (course && !result.some((item) => item.course.slug === course.slug)) result.push({ course, reason })
  }

  if (started.length === 0) {
    add(fresh[0], 'Der empfohlene Einstieg – ganz ohne Vorwissen')
  } else {
    const furthest = started.at(-1)!
    add(
      fresh.find((course) => course.position > furthest.position),
      `Kommt im Lernpfad nach „${furthest.title}“`,
    )
    const touched = new Set(started.map((course) => course.category))
    const nextArea = CATEGORY_ORDER.find((category) => !touched.has(category))
    if (nextArea) add(fresh.find((course) => course.category === nextArea), `Neues Gebiet: ${CATEGORY_LABELS[nextArea]}`)
  }
  const short = [...fresh].filter((course) => course.estimated_hours > 0).sort((a, b) => a.estimated_hours - b.estimated_hours || a.position - b.position)[0]
  if (short) add(short, `Kompakt: in etwa ${short.estimated_hours} Stunden geschafft`)
  return result.slice(0, 3)
}

function Discover({ dashboard, courses }: { dashboard: DashboardData; courses: CourseSummary[] }) {
  const items = useMemo(() => suggestions(dashboard, courses), [dashboard, courses])
  if (items.length === 0) return null

  return (
    <section>
      <SectionTitle
        aside={
          <Link to="/kurse" className="text-xs font-medium text-primary hover:underline">
            Alle Kurse
          </Link>
        }
      >
        <span className="inline-flex items-center gap-2">
          <Compass className="size-4 text-muted-foreground" /> Entdecken
        </span>
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ course, reason }) => (
          <Link
            key={course.slug}
            to={`/kurse/${course.slug}`}
            style={{ '--course': course.color ?? 'var(--brand)' } as CSSProperties}
            className="pressable group relative isolate flex flex-col overflow-hidden rounded-xl bg-card p-4 shadow-card transition-shadow hover:shadow-raised"
          >
            <span aria-hidden className="course-wash absolute inset-0 -z-10" />
            <CourseIcon icon={course.icon} color={course.color} size="sm" />
            <p className="mt-3 text-xs text-muted-foreground">{reason}</p>
            <p className="mt-1 leading-snug font-semibold">{course.title}</p>
            <p className="mt-auto pt-3 text-xs text-muted-foreground">
              {course.lessons_count} Lektionen · ca. {course.estimated_hours} h
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Badges({ badges }: { badges: DashboardData['badges'] }) {
  const earned = badges.filter((badge) => badge.earned).length
  return (
    <section>
      <SectionTitle aside={<span className="numeric text-xs text-muted-foreground">{earned} / {badges.length}</span>}>Abzeichen</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        {badges.map((badge) => {
          const Icon = iconFor(badge.icon)
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${badge.title}: ${badge.description}${badge.earned ? '' : ' (noch offen)'}`}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-xl transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
                    badge.earned ? 'bg-card text-foreground shadow-card' : 'bg-transparent text-muted-foreground/40 shadow-[inset_0_0_0_1px_var(--border)]',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </button>
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
  )
}

import { ArrowRight, Award, BookA, FolderGit2, HardDrive, TerminalSquare } from 'lucide-react'
import { Link } from 'react-router'
import { CourseCard } from '@/components/common/course-card'
import { Reveal } from '@/components/common/reveal'
import { Button } from '@/components/ui/button'
import type { CourseSummary } from '@/lib/api'
import { formatCount } from '@/lib/glossary-cache'
import { HeroTerminal } from './hero-terminal'
import { LearningMap } from './learning-map'
import { LessonTeaser } from './lesson-teaser'

const PILLARS = [
  {
    icon: TerminalSquare,
    title: 'Ein echtes Terminal',
    text: 'Git, npm, Composer, Artisan – in einem abgesicherten Container. Stacklab prüft danach den echten Zustand deiner Dateien, nicht deine Antwort.',
  },
  {
    icon: BookA,
    title: 'Jedes Wort erklärt',
    text: 'Fachbegriffe öffnen sich beim Darüberfahren. Was dir begegnet, sammelt sich in deinem Lexikon – zum Nachschlagen, wann immer du willst.',
  },
  {
    icon: FolderGit2,
    title: 'Ein Projekt pro Kurs',
    text: 'Du baust Schritt für Schritt etwas Echtes: ein Repository, eine API, eine App. Jeder Schritt wird automatisch geprüft.',
  },
  {
    icon: Award,
    title: 'Prüfung mit Zertifikat',
    text: 'Am Ende jedes Kurses eine Abschlussprüfung mit Auswertung pro Modul. Du siehst genau, was sitzt und was du wiederholen solltest.',
  },
]

export function Landing({ courses }: { courses: CourseSummary[] }) {
  const lessons = courses.reduce((sum, course) => sum + course.lessons_count, 0)
  const modules = courses.reduce((sum, course) => sum + course.modules_count, 0)
  const hours = courses.reduce((sum, course) => sum + course.estimated_hours, 0)
  const starters = [...courses].sort((a, b) => a.position - b.position).slice(0, 3)

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="dot-grid fade-edges pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-1.5 text-xs font-medium text-muted-foreground shadow-card">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[0.6875rem] text-primary">MIT</span>
              Open Source · läuft komplett auf deinem Rechner
            </p>
            <h1 className="display mt-6">
              IT lernen, indem du es <span className="text-primary">wirklich tust</span>.
            </h1>
            <p className="lead mt-6 max-w-xl">
              Vom ersten Terminal-Befehl bis zur eigenen App in Produktion. Du tippst echte Befehle, schreibst echten Code – und Stacklab prüft, was auf deiner
              Festplatte passiert ist.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-11 px-5 text-[0.95rem]">
                <Link to="/registrieren">
                  Kostenlos loslegen <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-11 px-4 text-[0.95rem]">
                <Link to="/kurse">Alle {courses.length} Kurse ansehen</Link>
              </Button>
            </div>
          </div>
          <div className="pb-6 lg:pb-0">
            <HeroTerminal />
          </div>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl sm:px-6">
          <dl className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {[
              [formatCount(courses.length), 'Kurse', 'in sechs Etappen'],
              [formatCount(lessons), 'Lektionen', `verteilt auf ${modules} Module`],
              [`~${formatCount(hours)}`, 'Stunden', 'zum Mitmachen, nicht zum Abhaken'],
              ['0 €', 'Kosten', 'Open Source, ohne Cloud-Konto'],
            ].map(([value, label, hint]) => (
              <div key={label} className="flex flex-col-reverse justify-end bg-card px-4 py-7 sm:px-6 sm:py-9">
                <dt className="mt-1 text-sm">
                  <span className="block font-medium">{label}</span>
                  <span className="mt-0.5 block text-muted-foreground">{hint}</span>
                </dt>
                <dd className="numeric text-3xl font-semibold sm:text-4xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Der Lernpfad</p>
            <h2 className="section-title mt-3">Eine Route von null bis live.</h2>
            <p className="lead mt-4">
              Sechs Etappen in empfohlener Reihenfolge – aber du entscheidest, wo du einsteigst. Such dir ein Ziel aus und sieh, was davor kommt.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.05} className="mt-10">
          <LearningMap courses={courses} />
        </Reveal>
      </section>

      <section className="border-t bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <LessonTeaser courses={courses} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Warum es hängen bleibt</p>
            <h2 className="section-title mt-3">Lesen erklärt. Tun bleibt.</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.05}>
              <pillar.icon className="size-5 text-primary" strokeWidth={1.75} />
              <h3 className="mt-4 font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Etappe 01</p>
            <h2 className="section-title mt-3">Hier fängst du an</h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/kurse">
              Alle Kurse <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {starters.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>

        <Reveal className="mt-20">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--code)] px-6 py-12 text-white sm:px-12 sm:py-16">
            <div aria-hidden className="absolute inset-0 opacity-40 [background-image:radial-gradient(oklch(1_0_0/10%)_1px,transparent_1px)] [background-size:18px_18px] fade-edges" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="font-mono text-sm text-emerald-300/90">
                  <span className="text-white/40">$</span> ./bin/start.sh
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Dein erster Befehl ist fünf Minuten entfernt.</h2>
                <p className="mt-4 flex items-center gap-2 text-white/60">
                  <HardDrive className="size-4 shrink-0" /> Konto und Fortschritt bleiben in der Datenbank auf deinem Rechner.
                </p>
              </div>
              <Button asChild size="lg" className="h-11 bg-white px-5 text-[0.95rem] text-black hover:bg-white/85">
                <Link to="/registrieren">
                  Konto anlegen <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}

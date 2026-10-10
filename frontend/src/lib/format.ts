export const CATEGORY_LABELS: Record<string, string> = {
  grundlagen: 'Grundlagen & Werkzeuge',
  web: 'Web & APIs',
  frontend: 'Frontend',
  backend: 'Backend',
  infrastruktur: 'Infrastruktur & Betrieb',
  abschluss: 'Abschluss',
}

export const CATEGORY_BLURBS: Record<string, string> = {
  grundlagen: 'Terminal, Git, Editor und Pakete – das Handwerkszeug, das du in jedem Projekt brauchst.',
  web: 'Wie Browser, Server und Programme miteinander sprechen – HTTP, APIs und Sicherheit.',
  frontend: 'Oberflächen bauen: von HTML und CSS über JavaScript und TypeScript bis React.',
  backend: 'Server-Logik mit PHP und Laravel, Datenbanken, Tests und sauberer Code.',
  infrastruktur: 'Container, Webserver, Deployments und die Cloud – deine App geht live.',
  abschluss: 'Alles zusammen: KI-Assistenten sinnvoll nutzen und eine komplette App ausliefern.',
}

export const CATEGORY_ORDER = ['grundlagen', 'web', 'frontend', 'backend', 'infrastruktur', 'abschluss']

export const LEVEL_LABELS: Record<string, string> = {
  einsteiger: 'Einsteiger',
  fortgeschritten: 'Fortgeschritten',
  profi: 'Profi',
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** Deterministic shuffle so a question keeps its order between renders. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = 0
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

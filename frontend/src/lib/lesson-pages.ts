export type LessonPage =
  | { kind: 'text'; title: string; markdown: string }
  | { kind: 'task'; title: string; taskIndex: number }
  | { kind: 'quiz'; title: string }
  | { kind: 'finish'; title: string }

/** Splits the lesson markdown at `##` headings; the intro joins the first section. */
export function splitSections(body: string): { title: string; markdown: string }[] {
  const lines = body.split('\n')
  const sections: { title: string; lines: string[] }[] = []
  const intro: string[] = []
  let inFence = false

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    const heading = !inFence ? /^##\s+(.+)$/.exec(line) : null
    if (heading) {
      sections.push({ title: heading[1]!.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, slug: string, label?: string) => label ?? slug).replace(/[`*_]/g, ''), lines: [line] })
    } else if (sections.length === 0) {
      intro.push(line)
    } else {
      sections[sections.length - 1]!.lines.push(line)
    }
  }

  const introText = intro.join('\n').trim()
  if (sections.length === 0) return [{ title: 'Einführung', markdown: introText }]
  if (introText) {
    if (introText.split(/\s+/).length > 120) {
      sections.unshift({ title: 'Einstieg', lines: [introText] })
    } else {
      sections[0]!.lines = [introText, '', ...sections[0]!.lines]
    }
  }
  return sections.map((section) => ({ title: section.title, markdown: section.lines.join('\n').trim() }))
}

export function buildPages(body: string, taskTitles: string[], hasQuiz: boolean): LessonPage[] {
  const pages: LessonPage[] = splitSections(body).map((section) => ({ kind: 'text', ...section }))
  taskTitles.forEach((title, taskIndex) => pages.push({ kind: 'task', title, taskIndex }))
  if (hasQuiz) pages.push({ kind: 'quiz', title: 'Quiz' })
  pages.push({ kind: 'finish', title: 'Abschluss' })
  return pages
}

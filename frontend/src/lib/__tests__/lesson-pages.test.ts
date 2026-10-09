import { describe, expect, it } from 'vitest'
import { buildPages, splitSections } from '@/lib/lesson-pages'

describe('lesson pages', () => {
  it('splits at level-2 headings and merges a short intro into the first section', () => {
    const sections = splitSections('Kurzer Einstieg.\n\n## Erstens\nText A\n\n## Zweitens [[git|Git]]\nText B')
    expect(sections.map((s) => s.title)).toEqual(['Erstens', 'Zweitens Git'])
    expect(sections[0]!.markdown).toContain('Kurzer Einstieg.')
  })

  it('keeps a long intro as its own page', () => {
    const intro = Array.from({ length: 130 }, () => 'Wort').join(' ')
    expect(splitSections(`${intro}\n\n## A\nx`).map((s) => s.title)).toEqual(['Einstieg', 'A'])
  })

  it('ignores headings inside code fences', () => {
    expect(splitSections('## A\n```md\n## kein Abschnitt\n```\n## B\ny')).toHaveLength(2)
  })

  it('appends task, quiz and finish pages', () => {
    const pages = buildPages('## A\nx', ['T1', 'T2'], true)
    expect(pages.map((p) => p.kind)).toEqual(['text', 'task', 'task', 'quiz', 'finish'])
  })
})

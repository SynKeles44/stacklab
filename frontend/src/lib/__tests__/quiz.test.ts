import { describe, expect, it } from 'vitest'
import type { Question } from '@/lib/content-schemas'
import { emptyAnswer, isAnswered, isCorrect, toPublic } from '@/lib/quiz'

const single: Question = { type: 'single', question: 'Q', options: ['a', 'b'], answer: 1, explanation: 'e' }
const multiple: Question = { type: 'multiple', question: 'Q', options: ['a', 'b', 'c'], answers: [0, 2], explanation: 'e' }
const cloze: Question = { type: 'cloze', text: 'git ___ und ___', blanks: [['init'], ['add', 'stage']], explanation: 'e' }
const match: Question = { type: 'match', question: 'Q', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }, { left: 'c', right: '3' }], explanation: 'e' }
const bug: Question = { type: 'find-bug', question: 'Q', code: 'a\nb', bug_line: 2, explanation: 'e' }

describe('quiz grading', () => {
  it('grades single and find-bug answers', () => {
    expect(isCorrect(single, 1)).toBe(true)
    expect(isCorrect(single, 0)).toBe(false)
    expect(isCorrect(bug, 2)).toBe(true)
    expect(isCorrect(bug, null)).toBe(false)
  })

  it('treats multiple choice as a set', () => {
    expect(isCorrect(multiple, [2, 0])).toBe(true)
    expect(isCorrect(multiple, [0])).toBe(false)
    expect(isCorrect(multiple, [0, 1, 2])).toBe(false)
  })

  it('accepts any listed cloze answer, case and whitespace insensitive', () => {
    expect(isCorrect(cloze, [' INIT ', 'stage'])).toBe(true)
    expect(isCorrect(cloze, ['init', 'commit'])).toBe(false)
  })

  it('grades matches by the right side, independent of shuffling', () => {
    expect(isCorrect(match, ['1', '2', '3'])).toBe(true)
    expect(isCorrect(match, ['2', '1', '3'])).toBe(false)
  })

  it('creates public questions without solutions', () => {
    const view = toPublic(match, 'seed')
    expect(view).not.toHaveProperty('pairs')
    expect(view.type === 'match' && [...view.rights].sort()).toEqual(['1', '2', '3'])
    expect(toPublic(match, 'seed')).toEqual(view)
  })

  it('knows when a question is answered', () => {
    const view = toPublic(cloze, 's')
    expect(isAnswered(view, emptyAnswer(view))).toBe(false)
    expect(isAnswered(view, ['init', ''])).toBe(false)
    expect(isAnswered(view, ['init', 'add'])).toBe(true)
  })
})

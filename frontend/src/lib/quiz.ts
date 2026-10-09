import type { PublicQuestion, Question } from '@/lib/content-schemas'
import { seededShuffle } from '@/lib/format'

export type Answer = number | number[] | string[] | null

export function toPublic(question: Question, seed: string): PublicQuestion {
  switch (question.type) {
    case 'single':
    case 'multiple':
      return { type: question.type, question: question.question, options: question.options }
    case 'cloze':
      return { type: 'cloze', question: question.question, text: question.text, blank_count: question.blanks.length }
    case 'match':
      return {
        type: 'match',
        question: question.question,
        lefts: question.pairs.map((pair) => pair.left),
        rights: seededShuffle(question.pairs.map((pair) => pair.right), seed),
      }
    case 'find-bug':
      return { type: 'find-bug', question: question.question, language: question.language, code: question.code }
  }
}

export function emptyAnswer(question: PublicQuestion): Answer {
  switch (question.type) {
    case 'single':
    case 'find-bug':
      return null
    case 'multiple':
      return []
    case 'cloze':
      return Array.from({ length: question.blank_count }, () => '')
    case 'match':
      return question.lefts.map(() => '')
  }
}

export function isAnswered(question: PublicQuestion, answer: Answer): boolean {
  if (answer === null) return false
  if (question.type === 'multiple') return Array.isArray(answer) && answer.length > 0
  if (question.type === 'cloze' || question.type === 'match') return Array.isArray(answer) && answer.every((value) => String(value).trim() !== '')
  return true
}

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase()

export function isCorrect(question: Question, answer: Answer): boolean {
  switch (question.type) {
    case 'single':
      return answer === question.answer
    case 'find-bug':
      return answer === question.bug_line
    case 'multiple': {
      if (!Array.isArray(answer)) return false
      const given = [...(answer as number[])].sort()
      const expected = [...question.answers].sort()
      return given.length === expected.length && given.every((value, index) => value === expected[index])
    }
    case 'cloze':
      return Array.isArray(answer) && question.blanks.every((accepted, index) => accepted.map(normalize).includes(normalize((answer as string[])[index])))
    case 'match':
      return Array.isArray(answer) && question.pairs.every((pair, index) => (answer as string[])[index] === pair.right)
  }
}

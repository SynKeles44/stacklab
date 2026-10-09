import { describe, expect, it } from 'vitest'
import { evaluateRequest } from '@/components/tasks/request-task'
import type { TaskOf } from '@/lib/content-schemas'

const task: TaskOf<'request'> = {
  id: 'r',
  type: 'request',
  title: 't',
  description: 'd',
  expected: { method: 'POST', path: '^/users$', headers: { 'Content-Type': 'application/json' }, body_contains: ['"name"'] },
}

describe('evaluateRequest', () => {
  it('accepts a correct request', () => {
    expect(evaluateRequest(task, { method: 'POST', path: '/users', headers: [{ name: 'content-type', value: 'application/json' }], body: '{"name":"Ada"}' })).toEqual([])
  })

  it('explains every mismatch', () => {
    const problems = evaluateRequest(task, { method: 'GET', path: '/user', headers: [], body: '{}' })
    expect(problems).toHaveLength(4)
    expect(problems.join(' ')).toContain('Content-Type')
  })
})

describe('evaluateRequest json body', () => {
  it('reports invalid JSON for write methods', () => {
    const problems = evaluateRequest(task, { method: 'POST', path: '/users', headers: [{ name: 'Content-Type', value: 'application/json' }], body: '{"name": }' })
    expect(problems).toEqual(['Der Body ist kein gültiges JSON (Anführungszeichen? Kommas?).'])
  })
})

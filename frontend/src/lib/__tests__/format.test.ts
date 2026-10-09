import { describe, expect, it } from 'vitest'
import { seededShuffle } from '@/lib/format'
import { slugifyHeading } from '@/components/markdown/lesson-markdown'

describe('helpers', () => {
  it('shuffles deterministically without losing items', () => {
    const a = seededShuffle([1, 2, 3, 4, 5], 'x')
    expect(seededShuffle([1, 2, 3, 4, 5], 'x')).toEqual(a)
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('slugifies german headings', () => {
    expect(slugifyHeading('1. Größe & Übersicht')).toBe('1-groesse-uebersicht')
  })
})

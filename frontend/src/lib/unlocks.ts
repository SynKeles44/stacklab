import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { createStore } from '@/lib/store'

export type UnlockedTerm = { slug: string; term: string; short: string }
export type UnlockEvent = { id: number; terms: UnlockedTerm[]; count: number; total: number }

export const unlockEvents = createStore<UnlockEvent[]>([])

const known = new Set<string>()
const pending = new Set<string>()
let timer: number | undefined
let counter = 0

export function isKnownTerm(slug: string): boolean {
  return known.has(slug)
}

export function markKnown(slugs: string[]): void {
  slugs.forEach((slug) => known.add(slug))
}

/** Collects terms that scrolled into view and unlocks them in one request. */
export function requestUnlock(slug: string): void {
  if (!getToken() || known.has(slug)) return
  known.add(slug)
  pending.add(slug)
  window.clearTimeout(timer)
  timer = window.setTimeout(flush, 600)
}

async function flush(): Promise<void> {
  const slugs = [...pending]
  pending.clear()
  if (slugs.length === 0) return
  try {
    const result = await Api.unlockTerms(slugs)
    if (result.unlocked.length > 0) {
      const event = { id: ++counter, terms: result.unlocked, count: result.unlocked_count, total: result.total }
      unlockEvents.set((events) => [...events, event])
      window.setTimeout(() => unlockEvents.set((events) => events.filter((e) => e.id !== event.id)), 4200)
    }
  } catch {
    slugs.forEach((slug) => known.delete(slug))
  }
}

import { toast } from 'sonner'
import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { createStore } from '@/lib/store'

const store = createStore<Set<string> | null>(null)
let loading: Promise<void> | null = null

const key = (type: string, ref: string) => `${type}:${ref}`

export function loadBookmarks(force = false): Promise<void> {
  if (!getToken()) {
    store.set(null)
    return Promise.resolve()
  }
  if (loading && !force) return loading
  loading = Api.bookmarks()
    .then(({ bookmarks }) => store.set(new Set(bookmarks.map((b) => key(b.type, b.ref)))))
    .catch(() => store.set(new Set()))
  return loading
}

export function useBookmarkKeys(): Set<string> | null {
  return store.use()
}

export function useIsBookmarked(type: string, ref: string): boolean {
  const set = store.use()
  return set?.has(key(type, ref)) ?? false
}

export async function toggleBookmark(input: { type: string; ref: string; label: string; url: string }): Promise<void> {
  if (!getToken()) {
    toast.info('Melde dich an, um Lesezeichen zu speichern.')
    return
  }
  const { bookmarked } = await Api.toggleBookmark(input)
  store.set((previous) => {
    const next = new Set(previous ?? [])
    if (bookmarked) next.add(key(input.type, input.ref))
    else next.delete(key(input.type, input.ref))
    return next
  })
  toast.success(bookmarked ? 'Lesezeichen gesetzt' : 'Lesezeichen entfernt', { description: input.label })
}

export function forgetBookmark(type: string, ref: string): void {
  store.set((previous) => {
    const next = new Set(previous ?? [])
    next.delete(key(type, ref))
    return next
  })
}

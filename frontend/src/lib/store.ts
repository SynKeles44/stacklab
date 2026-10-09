import { useSyncExternalStore } from 'react'

/** Minimal external store for small pieces of global UI state. */
export function createStore<T>(initial: T) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next: T | ((previous: T) => T)) {
      state = typeof next === 'function' ? (next as (previous: T) => T)(state) : next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    use(): T {
      return useSyncExternalStore(this.subscribe, this.get, this.get)
    },
  }
}

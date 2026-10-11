import { useSyncExternalStore } from 'react'

export type SessionUser = { id: number; name: string; email: string }

const TOKEN_KEY = 'stacklab.token'
const USER_KEY = 'stacklab.user'
const listeners = new Set<() => void>()

let cachedUser: SessionUser | null = readUser()

function readUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

function emit(): void {
  cachedUser = readUser()
  listeners.forEach((listener) => listener())
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setSession(token: string, user: SessionUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  emit()
}

export function updateSessionUser(user: SessionUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  emit()
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  emit()
}

export function currentUser(): SessionUser | null {
  return cachedUser
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY) emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, currentUser, () => null)
}

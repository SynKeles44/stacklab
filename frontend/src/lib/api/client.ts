import type { z } from 'zod'
import { getToken, clearSession } from '@/lib/auth'

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

type Options = { method?: string; body?: unknown; signal?: AbortSignal }

export async function api<S extends z.ZodType>(path: string, schema: S, options: Options = {}): Promise<z.infer<S>> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  const data: unknown = response.status === 204 ? {} : await response.json().catch(() => ({}))

  if (!response.ok) {
    const payload = (data ?? {}) as { message?: string; errors?: Record<string, string[]> }
    if (response.status === 401 && token) clearSession()
    throw new ApiError(payload.message ?? `Fehler ${response.status}`, response.status, payload.errors ?? {})
  }

  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    console.error(`Unexpected response for ${path}`, parsed.error.issues)
    throw new ApiError('Die Antwort des Servers hatte ein unerwartetes Format.', 500)
  }
  return parsed.data
}

import { Api } from '@/lib/api'
import { getToken } from '@/lib/auth'

type Glossary = Awaited<ReturnType<typeof Api.glossary>>

let cached: { at: number; token: string | null; data: Promise<Glossary> } | null = null

export function loadGlossary(maxAgeMs = 60_000): Promise<Glossary> {
  const token = getToken()
  if (cached && cached.token === token && Date.now() - cached.at < maxAgeMs) return cached.data
  const data = Api.glossary()
  cached = { at: Date.now(), token, data }
  data.catch(() => {
    cached = null
  })
  return data
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value)
}

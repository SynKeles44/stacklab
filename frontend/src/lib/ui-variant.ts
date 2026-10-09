import { createStore } from '@/lib/store'

export type UiVariant = 'standard' | 'apple'

const KEY = 'stacklab.ui'

function read(): UiVariant {
  try {
    return localStorage.getItem(KEY) === 'apple' ? 'apple' : 'standard'
  } catch {
    return 'standard'
  }
}

export const uiVariant = createStore<UiVariant>(read())

export function applyUiVariant(variant: UiVariant): void {
  try {
    localStorage.setItem(KEY, variant)
  } catch {
    // storage unavailable – the variant still applies for this page view
  }
  document.documentElement.dataset.ui = variant
  uiVariant.set(variant)
}

export function useUiVariant(): UiVariant {
  return uiVariant.use()
}

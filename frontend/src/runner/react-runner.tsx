import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { buildTestHarness, type LogLine, type TestCase } from '@/lib/runners/types'

const container = document.getElementById('root')!
let root: Root | null = null

const format = (value: unknown) => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

window.addEventListener('message', async (event: MessageEvent<{ id: number; code: string; tests: TestCase[] }>) => {
  const { id, code, tests } = event.data ?? {}
  if (typeof id !== 'number') return

  const logs: LogLine[] = []
  const push = (level: LogLine['level']) => (...args: unknown[]) => logs.push({ level, text: args.map(format).join(' ') })
  const consoleProxy = { log: push('log'), info: push('info'), warn: push('warn'), error: push('error') }

  const fail = (message: string): never => {
    throw new Error(message)
  }
  const query = (selector: string) => container.querySelector(selector)
  const helpers = {
    container,
    query,
    queryAll: (selector: string) => Array.from(container.querySelectorAll(selector)),
    text: () => container.textContent ?? '',
    click: async (selector: string) => {
      const element = query(selector) as HTMLElement | null
      if (!element) fail(`Kein Element für "${selector}" gefunden`)
      flushSync(() => element!.click())
      await wait()
    },
    type: async (selector: string, value: string) => {
      const element = query(selector) as HTMLInputElement | null
      if (!element) fail(`Kein Element für "${selector}" gefunden`)
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element!), 'value')?.set
      flushSync(() => {
        setter?.call(element, value)
        element!.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await wait()
    },
    assertEqual: (actual: unknown, expected: unknown, message?: string) => {
      if (!Object.is(actual, expected)) fail(message ?? `Erwartet ${format(expected)}, erhalten ${format(actual)}`)
    },
    assertTrue: (value: unknown, message?: string) => {
      if (value !== true) fail(message ?? `Erwartet true, erhalten ${format(value)}`)
    },
  }

  try {
    root?.unmount()
    root = createRoot(container)
    const factory = new Function('React', 'ReactDOM', 'console', `${code}\n;return typeof App !== 'undefined' ? App : undefined;`)
    const App = factory(React, ReactDOM, consoleProxy) as React.ComponentType | undefined
    if (!App) throw new Error('Definiere eine Komponente mit dem Namen App.')
    flushSync(() => root!.render(React.createElement(App)))
    await wait(10)

    const run = new Function(...Object.keys(helpers), 'console', `return (async () => { ${buildTestHarness(tests)} })()`)
    const results = await (await run(...Object.values(helpers), consoleProxy))
    window.parent.postMessage({ id, result: { ok: true, logs, results: results ?? [] } }, '*')
  } catch (error) {
    window.parent.postMessage({ id, result: { ok: false, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error), logs, results: [] } }, '*')
  }
})

window.parent.postMessage({ ready: true }, '*')

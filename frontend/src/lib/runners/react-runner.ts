import type { RunResult, TestCase } from './types'

let counter = 0

/** Runs a React component inside the sandboxed /runner.html iframe (no same-origin access). */
export async function runReact(iframe: HTMLIFrameElement, source: string, language: 'jsx' | 'tsx', tests: TestCase[], timeoutMs = 5000): Promise<RunResult> {
  const { transpile } = await import('./transpile')
  let compiled: string
  try {
    compiled = transpile(source, language)
  } catch (error) {
    return { ok: false, error: `Syntaxfehler: ${error instanceof Error ? error.message : String(error)}`, logs: [], results: [] }
  }

  const id = ++counter
  return new Promise<RunResult>((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow || event.data?.id !== id) return
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
      resolve(event.data.result as RunResult)
    }
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      resolve({ ok: false, error: 'Zeitlimit überschritten.', logs: [], results: [] })
    }, timeoutMs)
    window.addEventListener('message', onMessage)
    iframe.contentWindow?.postMessage({ id, code: compiled, tests }, '*')
  })
}

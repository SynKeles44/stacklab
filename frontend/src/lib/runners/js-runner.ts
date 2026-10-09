import type { CodeLanguage } from './transpile'
import { buildTestHarness, type RunResult, type TestCase } from './types'

const WORKER_SOURCE = `
const format = (value) => {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2) ?? String(value); } catch { return String(value); }
};
const deepEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
};
const fail = (message) => { throw new Error(message); };
const helpers = {
  assertEqual: (actual, expected, message) => { if (!Object.is(actual, expected)) fail(message || 'Erwartet ' + format(expected) + ', erhalten ' + format(actual)); },
  assertDeepEqual: (actual, expected, message) => { if (!deepEqual(actual, expected)) fail(message || 'Erwartet ' + format(expected) + ', erhalten ' + format(actual)); },
  assertTrue: (value, message) => { if (value !== true) fail(message || 'Erwartet true, erhalten ' + format(value)); },
  assertThrows: (fn, message) => { try { fn(); } catch { return; } fail(message || 'Erwartet, dass ein Fehler geworfen wird.'); },
};
self.onmessage = async (event) => {
  const logs = [];
  const push = (level) => (...args) => logs.push({ level, text: args.map(format).join(' ') });
  const consoleProxy = { log: push('log'), info: push('info'), warn: push('warn'), error: push('error'), table: push('log') };
  try {
    const fn = new Function('console', 'assertEqual', 'assertDeepEqual', 'assertTrue', 'assertThrows', event.data.code);
    const results = await fn(consoleProxy, helpers.assertEqual, helpers.assertDeepEqual, helpers.assertTrue, helpers.assertThrows);
    self.postMessage({ ok: true, logs, results: results || [] });
  } catch (error) {
    self.postMessage({ ok: false, error: (error && error.name ? error.name + ': ' : '') + String((error && error.message) || error), logs, results: [] });
  }
};
`

let workerUrl: string | null = null

export async function runJs(source: string, language: CodeLanguage, tests: TestCase[], timeoutMs = 4000): Promise<RunResult> {
  const { transpile } = await import('./transpile')
  let compiled: string
  try {
    compiled = transpile(source, language)
  } catch (error) {
    return { ok: false, error: `Syntaxfehler: ${error instanceof Error ? error.message : String(error)}`, logs: [], results: [] }
  }

  workerUrl ??= URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
  const worker = new Worker(workerUrl)

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      worker.terminate()
      resolve({ ok: false, error: `Zeitlimit von ${timeoutMs / 1000} s überschritten – gibt es eine Endlosschleife?`, logs: [], results: [] })
    }, timeoutMs)

    worker.onmessage = (event: MessageEvent<RunResult>) => {
      window.clearTimeout(timer)
      worker.terminate()
      resolve(event.data)
    }
    worker.onerror = (event) => {
      window.clearTimeout(timer)
      worker.terminate()
      resolve({ ok: false, error: event.message, logs: [], results: [] })
    }
    worker.postMessage({ code: compiled + buildTestHarness(tests) })
  })
}

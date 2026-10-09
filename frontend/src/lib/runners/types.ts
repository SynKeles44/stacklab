export type TestCase = { name: string; code: string }
export type TestResult = { name: string; passed: boolean; message?: string }
export type LogLine = { level: 'log' | 'warn' | 'error' | 'info'; text: string }
export type RunResult = { ok: boolean; error?: string; logs: LogLine[]; results: TestResult[] }

export function buildTestHarness(tests: TestCase[]): string {
  const blocks = tests
    .map(
      (test) => `try { await (async () => {\n${test.code}\n})(); __results.push({ name: ${JSON.stringify(test.name)}, passed: true }); }
catch (__error) { __results.push({ name: ${JSON.stringify(test.name)}, passed: false, message: String((__error && __error.message) || __error) }); }`,
    )
    .join('\n')
  return `\n;return (async () => { const __results = [];\n${blocks}\nreturn __results; })();`
}

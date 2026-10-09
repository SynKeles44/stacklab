import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBash } from './exec.ts';

export type PhpTest = { name: string; code: string };
export type PhpResult = { passed: boolean; output: string; results: { name: string; passed: boolean; message: string }[] };

const MARKER = '__STACKLAB_RESULTS__';

const PRELUDE = `<?php
final class StacklabAssertionFailed extends \\Exception {}
function assert_same(mixed $expected, mixed $actual, string $message = ''): void {
    if ($expected !== $actual) {
        throw new StacklabAssertionFailed($message !== '' ? $message : 'Erwartet ' . var_export($expected, true) . ', erhalten ' . var_export($actual, true));
    }
}
function assert_true(mixed $value, string $message = ''): void {
    if ($value !== true) {
        throw new StacklabAssertionFailed($message !== '' ? $message : 'Erwartet true, erhalten ' . var_export($value, true));
    }
}
$__stacklab_tests = [];
ob_start();
`;

/** main.php keeps the learner's line numbers: line 1 is the opening tag. */
export function buildMain(userCode: string): string {
  const code = userCode.replace(/^\s*<\?php[ \t]*/i, '').replace(/\?>\s*$/, '');
  return `<?php require __DIR__ . '/prelude.php';${code}\n;\nrequire __DIR__ . '/tests.php';\n`;
}

export function buildTests(tests: PhpTest[]): string {
  const blocks = tests
    .map((test) => `$__stacklab_tests[] = [${JSON.stringify(test.name)}, function () { ${test.code.replace(/^\s*<\?php\s*/i, '')}; }];`)
    .join('\n');

  return `<?php
${blocks}
$__stacklab_results = [];
foreach ($__stacklab_tests as [$__name, $__fn]) {
    try {
        $__fn();
        $__stacklab_results[] = ['name' => $__name, 'passed' => true, 'message' => 'OK'];
    } catch (\\Throwable $__e) {
        $__stacklab_results[] = ['name' => $__name, 'passed' => false, 'message' => $__e->getMessage()];
    }
}
echo ob_get_clean();
echo "\\n${MARKER}" . json_encode($__stacklab_results);
`;
}

export async function runPhp(userCode: string, tests: PhpTest[], timeoutMs: number): Promise<PhpResult> {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'stacklab-php-')));
  const clean = (text: string): string => text.split(`${dir}/`).join('').trim();
  try {
    writeFileSync(join(dir, 'prelude.php'), PRELUDE);
    writeFileSync(join(dir, 'tests.php'), buildTests(tests));
    writeFileSync(join(dir, 'main.php'), buildMain(userCode));
    const result = await runBash('php -d memory_limit=128M -d display_errors=stderr -d log_errors=0 main.php', dir, timeoutMs);
    if (result.timedOut) {
      return { passed: false, output: 'Zeitlimit überschritten – gibt es eine Endlosschleife?', results: [] };
    }
    const [output, json] = result.stdout.split(`\n${MARKER}`);
    if (json === undefined) {
      return { passed: false, output: clean(`${result.stdout}\n${result.stderr}`), results: [] };
    }
    const results = JSON.parse(json) as PhpResult['results'];
    return {
      passed: results.length > 0 && results.every((test) => test.passed),
      output: clean(`${output}${result.stderr ? `\n${result.stderr}` : ''}`),
      results,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

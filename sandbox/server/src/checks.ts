import { existsSync, readFileSync, statSync } from 'node:fs';
import { inside } from './paths.ts';
import { runBash } from './exec.ts';

export type Check = {
  type: 'file_exists' | 'dir_exists' | 'file_absent' | 'file_contains' | 'command';
  path?: string;
  pattern?: string;
  run?: string;
  expect_exit?: number;
  stdout_matches?: string;
  stdout_equals?: string;
  message?: string;
};

export type CheckResult = { passed: boolean; message: string; output?: string };

const DEFAULT_MESSAGES: Record<Check['type'], string> = {
  file_exists: 'Die Datei {path} existiert noch nicht.',
  dir_exists: 'Der Ordner {path} existiert noch nicht.',
  file_absent: '{path} sollte nicht mehr existieren.',
  file_contains: '{path} enthält noch nicht den erwarteten Inhalt.',
  command: 'Die Prüfung "{run}" ist noch nicht erfüllt.',
};

function failMessage(check: Check): string {
  const template = check.message ?? DEFAULT_MESSAGES[check.type];
  return template.replace('{path}', check.path ?? '').replace('{run}', check.run ?? '');
}

export async function runCheck(check: Check, cwd: string, timeoutMs: number): Promise<CheckResult> {
  const fail = (output?: string): CheckResult => ({ passed: false, message: failMessage(check), output });
  const ok = (): CheckResult => ({ passed: true, message: okLabel(check) });

  if (!existsSync(cwd) && check.type !== 'file_absent') {
    return { passed: false, message: 'Der Aufgabenordner existiert noch nicht. Setze die Aufgabe zurück, um ihn anzulegen.' };
  }

  switch (check.type) {
    case 'file_exists': {
      const target = inside(cwd, check.path ?? '');
      return existsSync(target) && statSync(target).isFile() ? ok() : fail();
    }
    case 'dir_exists': {
      const target = inside(cwd, check.path ?? '');
      return existsSync(target) && statSync(target).isDirectory() ? ok() : fail();
    }
    case 'file_absent': {
      const target = inside(cwd, check.path ?? '');
      return existsSync(target) ? fail() : ok();
    }
    case 'file_contains': {
      const target = inside(cwd, check.path ?? '');
      if (!existsSync(target) || !statSync(target).isFile()) {
        return fail();
      }
      const content = readFileSync(target, 'utf8');
      return new RegExp(check.pattern ?? '', 'm').test(content) ? ok() : fail();
    }
    case 'command': {
      const result = await runBash(check.run ?? 'false', cwd, timeoutMs);
      const output = (result.stdout + result.stderr).trim();
      if (result.timedOut) {
        return { passed: false, message: 'Die Prüfung hat zu lange gedauert.', output };
      }
      if (result.code !== (check.expect_exit ?? 0)) {
        return fail(output);
      }
      const stdout = result.stdout.replace(/\s+$/, '');
      if (check.stdout_equals !== undefined && stdout.trim() !== String(check.stdout_equals).trim()) {
        return fail(output);
      }
      if (check.stdout_matches !== undefined && !new RegExp(check.stdout_matches, 'm').test(stdout)) {
        return fail(output);
      }
      return ok();
    }
    default:
      return { passed: false, message: `Unbekannter Prüftyp: ${String((check as { type: unknown }).type)}` };
  }
}

function okLabel(check: Check): string {
  switch (check.type) {
    case 'file_exists':
      return `Datei ${check.path} gefunden`;
    case 'dir_exists':
      return `Ordner ${check.path} gefunden`;
    case 'file_absent':
      return `${check.path} ist entfernt`;
    case 'file_contains':
      return `${check.path} hat den richtigen Inhalt`;
    case 'command':
      return 'Prüfung bestanden';
  }
}

export async function runChecks(checks: Check[], cwd: string, timeoutMs: number): Promise<{ passed: boolean; results: CheckResult[] }> {
  const results: CheckResult[] = [];
  for (const check of checks) {
    try {
      results.push(await runCheck(check, cwd, timeoutMs));
    } catch (error) {
      results.push({ passed: false, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { passed: results.length > 0 && results.every((result) => result.passed), results };
}

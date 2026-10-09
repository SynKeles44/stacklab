import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { runChecks } from './checks.ts';
import { PathError, inside, taskDir } from './paths.ts';
import { buildMain, buildTests } from './php.ts';
import { sign, verify } from './token.ts';

test('signed tokens verify and expire', () => {
  const token = sign({ u: 1, w: 'git', exp: Math.floor(Date.now() / 1000) + 60 }, 'secret');
  assert.deepEqual(verify(token, 'secret')?.w, 'git');
  assert.equal(verify(token, 'other'), null);
  assert.equal(verify(token.replace(/.$/, 'x'), 'secret'), null);
  const expired = sign({ u: 1, w: 'git', exp: 1 }, 'secret');
  assert.equal(verify(expired, 'secret'), null);
});

test('paths cannot escape the workspace', () => {
  assert.throws(() => inside('/workspace/git', '../npm'), PathError);
  assert.throws(() => inside('/workspace/git', '/etc/passwd'), PathError);
  assert.throws(() => taskDir('/workspace', '../etc', 'x'), PathError);
  assert.throws(() => taskDir('/workspace', 'git', '.'), PathError);
  assert.equal(taskDir('/workspace', 'git', 'erstes-repo'), '/workspace/git/erstes-repo');
});

test('checks report the real file state', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'checks-'));
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'README.md'), '# Hallo Stacklab\n');

  const result = await runChecks(
    [
      { type: 'file_exists', path: 'README.md' },
      { type: 'dir_exists', path: 'src' },
      { type: 'file_absent', path: 'tmp.txt' },
      { type: 'file_contains', path: 'README.md', pattern: 'Hallo\\s+Stacklab' },
      { type: 'command', run: 'ls | wc -l', stdout_matches: '^\\s*2\\s*$' },
      { type: 'command', run: 'echo 42', stdout_equals: '42' },
    ],
    dir,
    5000,
  );
  assert.equal(result.passed, true, JSON.stringify(result.results));

  const failing = await runChecks([{ type: 'file_exists', path: 'fehlt.txt', message: 'fehlt' }], dir, 5000);
  assert.equal(failing.passed, false);
  assert.equal(failing.results[0]?.message, 'fehlt');
});

test('php main keeps learner line numbers and tests are separate', () => {
  const main = buildMain('<?php\nfunction add($a, $b) { return $a + $b; }');
  assert.equal(main.split('\n')[1], 'function add($a, $b) { return $a + $b; }');
  assert.match(buildTests([{ name: 'add', code: 'assert_same(3, add(1, 2))' }]), /\$__stacklab_tests\[\] = \["add"/);
});

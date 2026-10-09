import { spawn } from 'node:child_process';

export type ExecResult = { code: number | null; stdout: string; stderr: string; timedOut: boolean };

const MAX_OUTPUT = 64 * 1024;

/** Runs a bash script in a directory with a hard timeout; output is capped. */
export function runBash(script: string, cwd: string, timeoutMs: number, env: NodeJS.ProcessEnv = process.env): Promise<ExecResult> {
  return new Promise((resolvePromise) => {
    const child = spawn('bash', ['-lc', script], { cwd, env, detached: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid!, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += chunk.toString('utf8');
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolvePromise({ code, stdout, stderr, timedOut });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolvePromise({ code: -1, stdout, stderr: String(error), timedOut });
    });
  });
}

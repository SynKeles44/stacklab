import { readFileSync, existsSync } from 'node:fs';

export const PORT = Number(process.env.PORT ?? 7681);
export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? '/workspace';
export const SECRET_FILE = process.env.SANDBOX_SECRET_FILE ?? '/run/stacklab/sandbox.secret';
export const MAX_SESSIONS_PER_USER = Number(process.env.MAX_SESSIONS_PER_USER ?? 4);
export const IDLE_TIMEOUT_MS = Number(process.env.IDLE_TIMEOUT_MINUTES ?? 30) * 60_000;
export const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_SECONDS ?? 20) * 1000;
export const SETUP_TIMEOUT_MS = Number(process.env.SETUP_TIMEOUT_SECONDS ?? 180) * 1000;

export function readSecret(): string {
  if (process.env.SANDBOX_SECRET) {
    return process.env.SANDBOX_SECRET;
  }
  if (!existsSync(SECRET_FILE)) {
    throw new Error(`Sandbox secret file ${SECRET_FILE} does not exist`);
  }
  return readFileSync(SECRET_FILE, 'utf8').trim();
}

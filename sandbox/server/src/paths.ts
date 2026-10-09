import { resolve, sep } from 'node:path';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class PathError extends Error {}

export function courseDir(root: string, workspaceDir: string): string {
  if (!SLUG.test(workspaceDir)) {
    throw new PathError(`Invalid workspace directory: ${workspaceDir}`);
  }
  return resolve(root, workspaceDir);
}

/** Resolves a path below a base directory and refuses anything that escapes it. */
export function inside(base: string, relative: string): string {
  const target = resolve(base, relative);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new PathError(`Path escapes the workspace: ${relative}`);
  }
  return target;
}

export function taskDir(root: string, workspaceDir: string, workdir: string): string {
  const base = courseDir(root, workspaceDir);
  const target = inside(base, workdir || '.');
  if (target === base) {
    throw new PathError('A task needs its own sub directory');
  }
  return target;
}

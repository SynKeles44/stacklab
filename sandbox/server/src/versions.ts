import { runBash } from './exec.ts';

let cache: Record<string, string> | null = null;

const TOOLS: Record<string, string> = {
  git: 'git --version',
  node: 'node --version',
  npm: 'npm --version',
  bun: 'bun --version',
  php: "php -r 'echo PHP_VERSION;'",
  composer: 'composer --version --no-ansi 2>/dev/null | head -1',
  nvm: 'nvm --version',
};

export async function toolVersions(): Promise<Record<string, string>> {
  if (cache !== null) {
    return cache;
  }
  const result: Record<string, string> = {};
  for (const [tool, command] of Object.entries(TOOLS)) {
    const output = await runBash(command, '/tmp', 10_000);
    result[tool] = output.code === 0 ? output.stdout.trim() : 'nicht verfügbar';
  }
  cache = result;
  return result;
}

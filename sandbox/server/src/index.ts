import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocketServer } from 'ws';
import { runChecks, type Check } from './checks.ts';
import { COMMAND_TIMEOUT_MS, PORT, SETUP_TIMEOUT_MS, WORKSPACE_ROOT, readSecret } from './config.ts';
import { runBash } from './exec.ts';
import { PathError, courseDir, taskDir } from './paths.ts';
import { runPhp, type PhpTest } from './php.ts';
import { handleTerminal } from './terminal.ts';
import { secretMatches } from './token.ts';
import { toolVersions } from './versions.ts';

const secret = readSecret();
const MAX_BODY = 256 * 1024;

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) {
      throw new PathError('Request body too large');
    }
    chunks.push(chunk as Buffer);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  if (typeof parsed !== 'object' || parsed === null) {
    throw new PathError('Expected a JSON object');
  }
  return parsed as Record<string, unknown>;
}

const routes: Record<string, (body: Record<string, unknown>) => Promise<unknown>> = {
  '/api/check': async (body) => {
    const cwd = taskDir(WORKSPACE_ROOT, String(body.workspace_dir), String(body.workdir));
    return runChecks((body.checks as Check[]) ?? [], cwd, COMMAND_TIMEOUT_MS);
  },
  '/api/reset': async (body) => {
    const cwd = taskDir(WORKSPACE_ROOT, String(body.workspace_dir), String(body.workdir));
    rmSync(cwd, { recursive: true, force: true });
    mkdirSync(cwd, { recursive: true });
    const setup = typeof body.setup === 'string' ? body.setup : '';
    if (setup.trim() === '') {
      return { ok: true, output: '' };
    }
    const result = await runBash(`set -e\n${setup}`, cwd, SETUP_TIMEOUT_MS);
    return { ok: result.code === 0 && !result.timedOut, output: (result.stdout + result.stderr).trim() };
  },
  '/api/run-php': async (body) => {
    courseDir(WORKSPACE_ROOT, String(body.workspace_dir));
    return runPhp(String(body.code ?? ''), (body.tests as PhpTest[]) ?? [], COMMAND_TIMEOUT_MS);
  },
};

const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;

  if (request.method === 'GET' && path === '/api/health') {
    json(response, 200, { ok: true, workspace: existsSync(WORKSPACE_ROOT), tools: await toolVersions() });
    return;
  }

  const handler = routes[path];
  if (request.method !== 'POST' || handler === undefined) {
    json(response, 404, { error: 'Not found' });
    return;
  }

  if (!secretMatches(request.headers['x-stacklab-token'] as string | undefined, secret)) {
    json(response, 401, { error: 'Unauthorized' });
    return;
  }

  try {
    json(response, 200, await handler(await readJson(request)));
  } catch (error) {
    const status = error instanceof PathError || error instanceof SyntaxError ? 422 : 500;
    json(response, status, { error: error instanceof Error ? error.message : String(error) });
  }
});

const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

server.on('upgrade', (request, socket, head) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (path !== '/ws') {
    socket.destroy();
    return;
  }
  sockets.handleUpgrade(request, socket, head, (ws) => {
    try {
      handleTerminal(ws, request, secret);
    } catch (error) {
      ws.close(1011, error instanceof Error ? error.message.slice(0, 100) : 'error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Stacklab sandbox gateway listening on :${PORT}, workspace ${WORKSPACE_ROOT}`);
});

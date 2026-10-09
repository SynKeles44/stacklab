import { mkdirSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import * as pty from 'node-pty';
import type { WebSocket } from 'ws';
import { IDLE_TIMEOUT_MS, MAX_SESSIONS_PER_USER, WORKSPACE_ROOT } from './config.ts';
import { courseDir } from './paths.ts';
import { verify } from './token.ts';

type ClientMessage = { type: 'input'; data: string } | { type: 'resize'; cols: number; rows: number } | { type: 'ping' };

const sessionsPerUser = new Map<number, number>();

function send(socket: WebSocket, message: object): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function handleTerminal(socket: WebSocket, request: IncomingMessage, secret: string): void {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const claims = verify(url.searchParams.get('token') ?? '', secret);
  if (!claims) {
    send(socket, { type: 'error', message: 'Ungültige oder abgelaufene Terminal-Sitzung. Lade die Seite neu.' });
    socket.close(4401, 'unauthorized');
    return;
  }

  const active = sessionsPerUser.get(claims.u) ?? 0;
  if (active >= MAX_SESSIONS_PER_USER) {
    send(socket, { type: 'error', message: `Maximal ${MAX_SESSIONS_PER_USER} Terminals gleichzeitig. Schließe ein anderes Terminal.` });
    socket.close(4429, 'too many sessions');
    return;
  }
  sessionsPerUser.set(claims.u, active + 1);

  const cwd = courseDir(WORKSPACE_ROOT, claims.w);
  const requested = url.searchParams.get('cwd');
  mkdirSync(cwd, { recursive: true });

  const cols = Math.min(Math.max(Number(url.searchParams.get('cols') ?? 80), 20), 400);
  const rows = Math.min(Math.max(Number(url.searchParams.get('rows') ?? 24), 5), 200);

  const shell = pty.spawn('bash', ['--login'], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      STACKLAB_COURSE: claims.w,
      STACKLAB_START_DIR: requested && /^[a-z0-9][a-z0-9/_-]*$/.test(requested) ? requested : '',
      LANG: 'C.UTF-8',
    },
  });

  let idleTimer: NodeJS.Timeout;
  const resetIdle = (): void => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      send(socket, { type: 'output', data: '\r\n\x1b[33m[Sitzung wegen Inaktivität beendet]\x1b[0m\r\n' });
      socket.close(4408, 'idle');
    }, IDLE_TIMEOUT_MS);
  };
  resetIdle();

  shell.onData((data) => send(socket, { type: 'output', data }));
  shell.onExit(({ exitCode }) => {
    send(socket, { type: 'exit', code: exitCode });
    socket.close(1000, 'shell exited');
  });

  socket.on('message', (raw) => {
    resetIdle();
    let message: ClientMessage;
    try {
      message = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }
    if (message.type === 'input' && typeof message.data === 'string') {
      shell.write(message.data.slice(0, 16_384));
    } else if (message.type === 'resize') {
      const c = Math.min(Math.max(Math.floor(message.cols), 20), 400);
      const r = Math.min(Math.max(Math.floor(message.rows), 5), 200);
      shell.resize(c, r);
    }
  });

  socket.on('close', () => {
    clearTimeout(idleTimer);
    try {
      shell.kill('SIGHUP');
    } catch {
      // shell already gone
    }
    sessionsPerUser.set(claims.u, Math.max(0, (sessionsPerUser.get(claims.u) ?? 1) - 1));
  });
}

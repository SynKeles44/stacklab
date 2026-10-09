import { createHmac, timingSafeEqual } from 'node:crypto';

export type TerminalClaims = { u: number; w: string; exp: number };

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function sign(claims: TerminalClaims, secret: string): string {
  const payload = base64url(Buffer.from(JSON.stringify(claims)));
  const signature = base64url(createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verify(token: string, secret: string, now = Date.now()): TerminalClaims | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }
  const expected = Buffer.from(base64url(createHmac('sha256', secret).update(payload).digest()));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TerminalClaims;
    if (typeof claims.exp !== 'number' || claims.exp * 1000 < now) {
      return null;
    }
    if (typeof claims.u !== 'number' || typeof claims.w !== 'string') {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function secretMatches(given: string | undefined, secret: string): boolean {
  if (!given) {
    return false;
  }
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

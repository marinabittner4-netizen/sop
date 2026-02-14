import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'pb_admin';

function b64url(input: Buffer) {
  return input.toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function sign(payload: object) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET fehlt');
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac('sha256', secret).update(data).digest());
  return `${data}.${sig}`;
}

function verify(token: string) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error('ADMIN_JWT_SECRET fehlt');
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = b64url(crypto.createHmac('sha256', secret).update(data).digest());
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(data.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function setAdminCookie() {
  const token = sign({ role: 'admin', iat: Date.now() });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;
  return !!verify(token);
}

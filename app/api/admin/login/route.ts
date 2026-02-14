import { NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD fehlt in Env Vars' }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ ok: false, error: 'Falsches Passwort' }, { status: 401 });
    }
    setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Fehler' }, { status: 400 });
  }
}

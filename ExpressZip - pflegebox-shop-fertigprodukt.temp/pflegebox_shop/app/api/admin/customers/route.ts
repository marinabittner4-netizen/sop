import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from('customers')
      .select('id, first_name, last_name, dob, zip, city, insurance_type, insurance_name, care_grade, beihilfe_percent, updated_at, created_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Fehler' }, { status: 500 });
  }
}

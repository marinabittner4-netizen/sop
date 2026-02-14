import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get('customerId');

    const sb = supabaseAdmin();
    let q = sb.from('orders').select('id,order_number,created_at,month_key,total,budget_max,status,customer_id').order('created_at',{ ascending:false }).limit(200);
    if (customerId) q = q.eq('customer_id', customerId);
    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Fehler' }, { status: 400 });
  }
}

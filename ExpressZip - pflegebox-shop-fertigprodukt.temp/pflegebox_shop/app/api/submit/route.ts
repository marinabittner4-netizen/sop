import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { SubmitSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = SubmitSchema.parse(json);

    const sb = supabaseAdmin();

    // 1) Customer upsert-ish: identify by (first,last,dob) + postal code
    const { firstName, lastName, dob, street, zip, city, phone, email, insuranceType, insuranceName, careGrade, beihilfePercent, legalRepPresent, legalRepName } = parsed.customer;

    const lookup = await sb
      .from('customers')
      .select('*')
      .eq('first_name', firstName)
      .eq('last_name', lastName)
      .eq('dob', dob)
      .eq('zip', zip)
      .limit(1);

    let customerId: string;
    if (lookup.data && lookup.data.length > 0) {
      customerId = lookup.data[0].id;
      await sb
        .from('customers')
        .update({
          street,
          city,
          phone,
          email,
          insurance_type: insuranceType,
          insurance_name: insuranceName,
          care_grade: careGrade,
          beihilfe_percent: beihilfePercent,
          legal_rep_present: legalRepPresent,
          legal_rep_name: legalRepName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    } else {
      const ins = await sb
        .from('customers')
        .insert({
          first_name: firstName,
          last_name: lastName,
          dob,
          street,
          zip,
          city,
          phone,
          email,
          insurance_type: insuranceType,
          insurance_name: insuranceName,
          care_grade: careGrade,
          beihilfe_percent: beihilfePercent,
          legal_rep_present: legalRepPresent,
          legal_rep_name: legalRepName,
        })
        .select('id')
        .single();

      if (ins.error) throw ins.error;
      customerId = ins.data.id;
    }

    // 2) Create order
    const { monthKey, total, budgetMax, items } = parsed.order;

    const orderIns = await sb
      .from('orders')
      .insert({
        customer_id: customerId,
        month_key: monthKey,
        total,
        budget_max: budgetMax,
        status: 'offen',
      })
      .select('id, order_number, created_at')
      .single();

    if (orderIns.error) throw orderIns.error;

    const orderId = orderIns.data.id as string;

    // 3) Insert items
    if (items.length > 0) {
      const rows = items.map((it) => ({
        order_id: orderId,
        product_id: it.productId,
        name: it.name,
        category: it.category,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        size: it.size ?? null,
        line_total: Math.round((it.unitPrice * it.quantity) * 100) / 100,
      }));

      const itemsIns = await sb.from('order_items').insert(rows);
      if (itemsIns.error) throw itemsIns.error;
    }

    return NextResponse.json({
      ok: true,
      customerId,
      orderId,
      orderNumber: orderIns.data.order_number,
      createdAt: orderIns.data.created_at,
    });
  } catch (e: any) {
    const message = e?.message || 'Unbekannter Fehler';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

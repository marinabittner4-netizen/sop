import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in Vercel Environment Variables setzen.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

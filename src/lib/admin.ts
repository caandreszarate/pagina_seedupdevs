import { supabaseAdmin } from '@/lib/supabase';

export async function verifyAdminByEmail(email: string): Promise<string | null> {
  if (!email?.trim()) return null;
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, is_admin')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data?.is_admin ? data.id : null;
}

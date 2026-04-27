import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const adminEmail = req.nextUrl.searchParams.get('email') ?? '';
  const adminId = await verifyAdminByEmail(adminEmail);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('team_applications')
    .select('id, level, stack, availability, status, created_at, users(id, nombres, apellidos, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Error al obtener aplicaciones' }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}

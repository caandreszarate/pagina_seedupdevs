import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!(await verifyAdminByEmail(email))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const ratingFilter = req.nextUrl.searchParams.get('rating');

  let query = supabaseAdmin
    .from('feedback')
    .select('id, rating, message, source, created_at, users(id, nombres, apellidos, email)')
    .order('created_at', { ascending: false });

  if (ratingFilter) {
    query = query.eq('rating', parseInt(ratingFilter));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Error al obtener feedback' }, { status: 500 });

  return NextResponse.json({ feedback: data ?? [] });
}

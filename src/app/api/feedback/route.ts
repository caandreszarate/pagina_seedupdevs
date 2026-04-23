import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: { email: string; rating: number; message?: string; source?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { email, rating, message, source = 'web' } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating debe ser entre 1 y 5' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from('feedback').insert({
    user_id: user.id,
    rating,
    message: message?.trim() || null,
    source: ['email', 'web'].includes(source) ? source : 'web',
  });

  if (error) {
    return NextResponse.json({ error: 'Error al guardar feedback' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

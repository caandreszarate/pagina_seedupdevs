import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, nombres, apellidos, current_level, created_at')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const [{ data: evaluations }, { data: lastFeedback }] = await Promise.all([
    supabaseAdmin
      .from('evaluations')
      .select('id, nivel, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('feedback')
      .select('rating, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    nombres: user.nombres,
    apellidos: user.apellidos,
    current_level: user.current_level,
    member_since: user.created_at,
    evaluations: evaluations ?? [],
    last_feedback: lastFeedback ?? null,
  });
}

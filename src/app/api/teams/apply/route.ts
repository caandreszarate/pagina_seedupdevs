import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let body: { email?: string; stack?: string; availability?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { email, stack, availability } = body;

  if (!email?.trim() || !stack?.trim() || !availability?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, current_level')
    .eq('email', emailNorm)
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado. Completa tu evaluación primero.' },
      { status: 404 },
    );
  }

  if (!user.current_level) {
    return NextResponse.json(
      { error: 'Debes completar la evaluación antes de aplicar.' },
      { status: 422 },
    );
  }

  const { data: pendingApp } = await supabaseAdmin
    .from('team_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (pendingApp) {
    return NextResponse.json({ error: 'Ya tienes una aplicación pendiente.' }, { status: 409 });
  }

  const { data: membership } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membership) {
    return NextResponse.json({ error: 'Ya perteneces a un equipo.' }, { status: 409 });
  }

  const { error: errInsert } = await supabaseAdmin.from('team_applications').insert({
    user_id: user.id,
    level: user.current_level,
    stack: stack.trim(),
    availability: availability.trim(),
    status: 'pending',
  });

  if (errInsert) {
    return NextResponse.json({ error: 'Error al guardar aplicación' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

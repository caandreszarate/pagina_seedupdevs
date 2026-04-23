import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendFollowupEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  let body: { email: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { email } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, nombres')
    .eq('email', emailNorm)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const sent = await sendFollowupEmail({ to: emailNorm, nombres: user.nombres });
  const status = sent ? 'sent' : 'failed';

  await supabaseAdmin.from('communications_log').insert({
    user_id: user.id,
    type: 'followup',
    status,
  });

  if (sent) {
    await supabaseAdmin
      .from('users')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  return NextResponse.json({ ok: sent, status });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';
import { ROLE_MAP } from '@/lib/niveles';
import type { Nivel } from '@/types/evaluacion';

export async function POST(req: NextRequest) {
  let body: { admin_email: string; user_id: string; new_level: Nivel; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { admin_email, user_id, new_level, reason = 'admin_override' } = body;

  if (!new_level || !user_id) {
    return NextResponse.json({ error: 'user_id y new_level son requeridos' }, { status: 400 });
  }

  const adminId = await verifyAdminByEmail(admin_email);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('current_level, discord_id')
    .eq('id', user_id)
    .single();

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const previousLevel = (user.current_level ?? null) as Nivel | null;

  await supabaseAdmin.from('users').update({ current_level: new_level }).eq('id', user_id);

  await supabaseAdmin.from('progress_logs').insert({
    user_id,
    previous_level: previousLevel,
    new_level,
    reason,
  });

  // Discord sync (no downgrade restriction for admin)
  const discordId = user.discord_id as string | null;
  if (discordId) {
    const guildId = process.env.DISCORD_GUILD_ID!;
    const botToken = process.env.DISCORD_BOT_TOKEN!;
    const base = `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles`;
    const headers = { Authorization: `Bot ${botToken}` };

    if (previousLevel && ROLE_MAP[previousLevel]) {
      await fetch(`${base}/${ROLE_MAP[previousLevel]}`, { method: 'DELETE', headers }).catch(() => {});
    }
    if (ROLE_MAP[new_level]) {
      await fetch(`${base}/${ROLE_MAP[new_level]}`, { method: 'PUT', headers }).catch(() => {});
    }
  }

  await supabaseAdmin.from('admin_logs').insert({
    admin_id: adminId,
    action: 'update_level',
    target_user_id: user_id,
    metadata: { previous_level: previousLevel, new_level, reason },
  });

  return NextResponse.json({ ok: true, previous_level: previousLevel, new_level });
}

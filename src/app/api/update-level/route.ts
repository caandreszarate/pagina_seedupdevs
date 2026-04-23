import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isUpgrade, ROLE_MAP } from '@/lib/niveles';
import type { Nivel } from '@/types/evaluacion';

export interface UpdateLevelResult {
  upgraded: boolean;
  previous_level: Nivel | null;
  new_level: Nivel;
}

export async function POST(req: NextRequest) {
  let body: { user_id: string; nivel: Nivel };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { user_id, nivel } = body;

  if (!user_id || !nivel) {
    return NextResponse.json({ error: 'user_id y nivel son requeridos' }, { status: 400 });
  }

  const result = await applyLevelUpdate(user_id, nivel);
  return NextResponse.json(result);
}

export async function applyLevelUpdate(
  userId: string,
  newNivel: Nivel,
): Promise<UpdateLevelResult> {
  const { data: usuario } = await supabaseAdmin
    .from('users')
    .select('current_level, discord_id')
    .eq('id', userId)
    .single();

  const previousLevel = (usuario?.current_level ?? null) as Nivel | null;
  const upgraded = isUpgrade(previousLevel, newNivel);

  if (!upgraded) {
    return { upgraded: false, previous_level: previousLevel, new_level: newNivel };
  }

  // Actualizar current_level
  await supabaseAdmin
    .from('users')
    .update({ current_level: newNivel })
    .eq('id', userId);

  // Registrar en progress_logs
  await supabaseAdmin.from('progress_logs').insert({
    user_id: userId,
    previous_level: previousLevel,
    new_level: newNivel,
    reason: 'evaluation',
  });

  // Sincronizar rol en Discord si el usuario ya está conectado
  const discordId = usuario?.discord_id as string | null;
  if (discordId) {
    await syncDiscordRole(discordId, previousLevel, newNivel);
  }

  return { upgraded: true, previous_level: previousLevel, new_level: newNivel };
}

async function syncDiscordRole(
  discordId: string,
  previousLevel: Nivel | null,
  newLevel: Nivel,
): Promise<void> {
  const guildId  = process.env.DISCORD_GUILD_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const base     = `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles`;
  const headers  = { Authorization: `Bot ${botToken}` };

  // Remover rol anterior si existía
  if (previousLevel && ROLE_MAP[previousLevel]) {
    await fetch(`${base}/${ROLE_MAP[previousLevel]}`, { method: 'DELETE', headers }).catch(() => {});
  }

  // Asignar nuevo rol
  if (ROLE_MAP[newLevel]) {
    await fetch(`${base}/${ROLE_MAP[newLevel]}`, { method: 'PUT', headers }).catch(() => {});
  }
}

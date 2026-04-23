import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Nivel } from '@/types/evaluacion';

const ROLE_MAP: Record<Nivel, string> = {
  'dev-zero':     process.env.DISCORD_ROLE_DEV_ZERO!,
  'dev-bronce':   process.env.DISCORD_ROLE_DEV_BRONCE!,
  'dev-silver':   process.env.DISCORD_ROLE_DEV_SILVER!,
  'dev-gold':     process.env.DISCORD_ROLE_DEV_GOLD!,
  'dev-platinum': process.env.DISCORD_ROLE_DEV_PLATINUM!,
};

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const resultadoUrl = `${origin}/resultado`;

  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Autorización cancelada')}`,
    );
  }

  // ── Decodificar email del state ─────────────────────────────────────────
  let email: string;
  try {
    email = Buffer.from(state, 'base64').toString('utf-8');
  } catch {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Estado inválido')}`,
    );
  }

  // ── Intercambiar code por access_token ──────────────────────────────────
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID!.trim(),
        client_secret: process.env.DISCORD_CLIENT_SECRET!.trim(),
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI!.trim(),
      }),
    });
    if (!tokenRes.ok) throw new Error(`Token error: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } catch {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Error al obtener token de Discord')}`,
    );
  }

  // ── Obtener datos del usuario de Discord ────────────────────────────────
  let discordId: string;
  let discordUsername: string;
  try {
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) throw new Error(`User fetch error: ${userRes.status}`);
    const userData = await userRes.json();
    discordId       = userData.id;
    discordUsername = userData.username;
  } catch {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Error al obtener datos de Discord')}`,
    );
  }

  // ── Buscar usuario en Supabase por email ────────────────────────────────
  const { data: usuario } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!usuario) {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Usuario no encontrado en la base de datos')}`,
    );
  }

  // ── Obtener evaluación más reciente para determinar nivel ───────────────
  const { data: evaluacion } = await supabaseAdmin
    .from('evaluations')
    .select('nivel')
    .eq('user_id', usuario.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evaluacion) {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('No se encontró evaluación para este usuario')}`,
    );
  }

  // ── Guardar Discord ID y username en la DB ──────────────────────────────
  await supabaseAdmin
    .from('users')
    .update({ discord_id: discordId, discord_username: discordUsername })
    .eq('id', usuario.id);

  const guildId = process.env.DISCORD_GUILD_ID!;
  const botToken = process.env.DISCORD_BOT_TOKEN!;
  const roleId   = ROLE_MAP[evaluacion.nivel as Nivel];

  if (!roleId) {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent(`Rol no configurado para el nivel ${evaluacion.nivel}`)}`,
    );
  }

  // ── Agregar usuario al servidor (auto-join) ─────────────────────────────
  try {
    const addRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      },
    );
    // 201 = agregado, 204 = ya era miembro — ambos son OK
    if (!addRes.ok && addRes.status !== 204) {
      throw new Error(`Add member error: ${addRes.status}`);
    }
  } catch {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Error al agregar al servidor de Discord')}`,
    );
  }

  // ── Asignar rol ─────────────────────────────────────────────────────────
  try {
    const roleRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bot ${botToken}` },
      },
    );
    if (!roleRes.ok) throw new Error(`Role assign error: ${roleRes.status}`);
  } catch {
    return NextResponse.redirect(
      `${resultadoUrl}?discord=error&msg=${encodeURIComponent('Error al asignar rol en Discord')}`,
    );
  }

  return NextResponse.redirect(
    `${resultadoUrl}?discord=success&username=${encodeURIComponent(discordUsername)}&nivel=${evaluacion.nivel}`,
  );
}

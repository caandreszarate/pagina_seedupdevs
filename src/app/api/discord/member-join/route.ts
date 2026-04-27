import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { assignVisitorRole, logDiscordActivity } from '@/lib/discord';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-bot-secret');
  if (!secret || secret !== process.env.DISCORD_BOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { discord_id?: string; discord_username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { discord_id, discord_username } = body;

  if (!discord_id?.trim()) {
    return NextResponse.json({ error: 'discord_id requerido' }, { status: 400 });
  }

  // ── Check if discord_id belongs to a verified user ──────────────────────
  const { data: existingUser, error: userLookupError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('discord_id', discord_id)
    .maybeSingle();

  if (userLookupError) {
    console.error('[member-join] Failed to query users:', userLookupError);
    return NextResponse.json(
      { ok: false, status: 'lookup_failed', error: userLookupError.message },
      { status: 500 },
    );
  }

  if (existingUser) {
    return NextResponse.json({ ok: true, status: 'already_verified' });
  }

  // ── Upsert visitor record ────────────────────────────────────────────────
  const { error: upsertError } = await supabaseAdmin.from('discord_visitors').upsert(
    {
      discord_id,
      discord_username: discord_username ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'discord_id', ignoreDuplicates: false },
  );

  if (upsertError) {
    console.error('[member-join] Failed to upsert discord_visitors:', upsertError);
    return NextResponse.json(
      { ok: false, status: 'visitor_record_failed', error: upsertError.message },
      { status: 500 },
    );
  }

  // ── Assign Visitor role (best-effort) ────────────────────────────────────
  const roleAssigned = await assignVisitorRole(discord_id);

  if (!roleAssigned) {
    console.error(`[member-join] Failed to assign Visitor role for discord_id: ${discord_id}`);
  }

  // ── Log activity (best-effort) ───────────────────────────────────────────
  try {
    await logDiscordActivity({
      discordId: discord_id,
      eventType: 'member_join',
      metadata: { extra: { roleAssigned, discord_username: discord_username ?? null } },
    });
  } catch (err) {
    console.error('[member-join] logDiscordActivity failed:', err);
  }

  return NextResponse.json({
    ok: true,
    status: roleAssigned ? 'visitor_assigned' : 'visitor_recorded_role_failed',
    roleAssigned,
  });
}

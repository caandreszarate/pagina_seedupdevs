import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';
import { sendDiscordMessage } from '@/lib/discord';

export async function POST(req: NextRequest) {
  let body: { admin_email?: string; team_id?: string; user_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { admin_email, team_id, user_ids } = body;

  if (!admin_email || !team_id || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: 'Campos inválidos' }, { status: 400 });
  }

  const adminId = await verifyAdminByEmail(admin_email);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('id, name, level')
    .eq('id', team_id)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
  }

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, nombres, current_level')
    .in('id', user_ids);

  if (!users || users.length !== user_ids.length) {
    return NextResponse.json({ error: 'Uno o más usuarios no encontrados' }, { status: 404 });
  }

  const mismatched = users.filter((u) => u.current_level !== team.level);
  if (mismatched.length > 0) {
    return NextResponse.json(
      { error: `Nivel incompatible: el equipo es ${team.level} pero algunos usuarios tienen otro nivel` },
      { status: 422 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('user_id')
    .in('user_id', user_ids);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Uno o más usuarios ya pertenecen a un equipo' },
      { status: 409 },
    );
  }

  const { error: errInsert } = await supabaseAdmin
    .from('team_members')
    .insert(user_ids.map((uid) => ({ team_id, user_id: uid, role: 'member' })));

  if (errInsert) {
    return NextResponse.json({ error: 'Error al asignar miembros' }, { status: 500 });
  }

  await supabaseAdmin
    .from('team_applications')
    .update({ status: 'assigned' })
    .in('user_id', user_ids)
    .eq('status', 'pending');

  for (const user of users) {
    void sendDiscordMessage(`👤 ${user.nombres} fue asignado al equipo ${team.name}`);
  }

  return NextResponse.json({ ok: true });
}

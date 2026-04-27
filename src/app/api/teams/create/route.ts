import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';
import { sendDiscordMessage } from '@/lib/discord';

export async function POST(req: NextRequest) {
  let body: { admin_email?: string; name?: string; level?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { admin_email, name, level } = body;

  if (!admin_email || !name?.trim() || !level?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
  }

  const adminId = await verifyAdminByEmail(admin_email);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .insert({ name: name.trim(), level: level.trim(), status: 'forming' })
    .select('id, name, level, status')
    .single();

  if (error || !team) {
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
  }

  void sendDiscordMessage(`👥 Nuevo equipo creado: ${team.name}`);

  return NextResponse.json({ ok: true, team });
}

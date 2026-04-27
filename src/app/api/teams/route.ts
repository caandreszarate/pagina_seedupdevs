import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: teams, error } = await supabaseAdmin
    .from('teams')
    .select('id, name, level, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Error al obtener equipos' }, { status: 500 });
  }

  const teamIds = (teams ?? []).map((t) => t.id);
  const memberCounts: Record<string, number> = {};

  if (teamIds.length > 0) {
    const { data: members } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    for (const m of members ?? []) {
      memberCounts[m.team_id] = (memberCounts[m.team_id] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    teams: (teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      level: t.level,
      status: t.status,
      member_count: memberCounts[t.id] ?? 0,
    })),
  });
}

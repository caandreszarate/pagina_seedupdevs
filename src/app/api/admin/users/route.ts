import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!(await verifyAdminByEmail(email))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get('search') ?? '';

  let query = supabaseAdmin
    .from('users')
    .select('id, nombres, apellidos, email, current_level, created_at, discord_username, evaluations(id, created_at)')
    .order('created_at', { ascending: false });

  if (search.trim()) {
    query = query.or(
      `nombres.ilike.%${search}%,apellidos.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const users = (data ?? []).map(u => {
    const evals = (u.evaluations as Array<{ id: string; created_at: string }>) ?? [];
    const lastEvalDate =
      evals.length > 0
        ? new Date(Math.max(...evals.map(e => new Date(e.created_at).getTime())))
        : null;
    const condA = evals.length === 1 && new Date(u.created_at) < sevenDaysAgo;
    const condB = !lastEvalDate || lastEvalDate < fourteenDaysAgo;

    return {
      id: u.id,
      nombres: u.nombres,
      apellidos: u.apellidos,
      email: u.email,
      current_level: u.current_level,
      discord_username: u.discord_username,
      created_at: u.created_at,
      evaluation_count: evals.length,
      is_critical: condA || condB,
    };
  });

  return NextResponse.json({ users });
}

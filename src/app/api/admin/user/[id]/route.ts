import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!(await verifyAdminByEmail(email))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  const [
    { data: user },
    { data: evaluations },
    { data: feedback },
    { data: progressLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select(
        'id, nombres, apellidos, email, telefono, current_level, discord_id, discord_username, created_at, last_contacted_at, activity_score',
      )
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('evaluations')
      .select('id, nivel, score, fortalezas, debilidades, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('feedback')
      .select('id, rating, message, source, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('progress_logs')
      .select('id, previous_level, new_level, reason, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  return NextResponse.json({
    user,
    evaluations: evaluations ?? [],
    feedback: feedback ?? [],
    progress_logs: progressLogs ?? [],
  });
}

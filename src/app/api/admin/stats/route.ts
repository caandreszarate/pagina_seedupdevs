import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!(await verifyAdminByEmail(email))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const [
    { count: totalUsers },
    { data: usersData },
    { data: feedbackData },
    { count: totalEvaluations },
    { count: totalUpgrades },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('current_level, created_at, evaluations(id, created_at)'),
    supabaseAdmin.from('feedback').select('rating'),
    supabaseAdmin.from('evaluations').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('progress_logs').select('id', { count: 'exact', head: true }),
  ]);

  const levelDist: Record<string, number> = {};
  for (const u of usersData ?? []) {
    const level = u.current_level ?? 'sin-nivel';
    levelDist[level] = (levelDist[level] ?? 0) + 1;
  }

  const ratings = (feedbackData ?? []).map(r => r.rating).filter(Boolean);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  let criticalCount = 0;
  for (const user of usersData ?? []) {
    const evals = (user.evaluations as Array<{ id: string; created_at: string }>) ?? [];
    const lastEvalDate =
      evals.length > 0
        ? new Date(Math.max(...evals.map(e => new Date(e.created_at).getTime())))
        : null;
    const condA = evals.length === 1 && new Date(user.created_at) < sevenDaysAgo;
    const condB = !lastEvalDate || lastEvalDate < fourteenDaysAgo;
    if (condA || condB) criticalCount++;
  }

  return NextResponse.json({
    total_users: totalUsers ?? 0,
    users_by_level: levelDist,
    avg_rating: avgRating,
    total_evaluations: totalEvaluations ?? 0,
    total_upgrades: totalUpgrades ?? 0,
    critical_users: criticalCount,
  });
}

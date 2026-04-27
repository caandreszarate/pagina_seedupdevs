import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import {
  runDailySeed,
  runDailyChallenge,
  runDailyWins,
  runWeeklyRanking,
  runInactiveNudges,
  runWeeklyReset,
  runScanOpportunities,
} from '@/lib/community-actions';

const ALLOWED_ACTIONS = [
  'daily-seed',
  'daily-challenge',
  'daily-wins',
  'weekly-ranking',
  'inactive-nudges',
  'weekly-reset',
  'scan-opportunities',
] as const;

type Action = typeof ALLOWED_ACTIONS[number];

const ACTION_MAP: Record<Action, () => Promise<object>> = {
  'daily-seed': runDailySeed,
  'daily-challenge': runDailyChallenge,
  'daily-wins': runDailyWins,
  'weekly-ranking': runWeeklyRanking,
  'inactive-nudges': runInactiveNudges,
  'weekly-reset': runWeeklyReset,
  'scan-opportunities': runScanOpportunities,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { admin_email?: string; action?: string } = {};
  try {
    body = await req.json() as { admin_email?: string; action?: string };
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!body.admin_email || !body.action) {
    return NextResponse.json({ error: 'admin_email y action requeridos' }, { status: 400 });
  }

  const isAdmin = await verifyAdminByEmail(body.admin_email);
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  if (!ALLOWED_ACTIONS.includes(body.action as Action)) {
    return NextResponse.json({ error: 'Acción no permitida' }, { status: 400 });
  }

  const action = body.action as Action;

  try {
    const result = await ACTION_MAP[action]();
    return NextResponse.json({ ok: true, action, result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, action, error: (err as Error).message },
      { status: 500 },
    );
  }
}

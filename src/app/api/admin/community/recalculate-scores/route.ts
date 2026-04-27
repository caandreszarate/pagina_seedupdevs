import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { recalculateCommunityScores } from '@/lib/community-scoring';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { admin_email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { admin_email } = body;
  if (!admin_email) {
    return NextResponse.json({ error: 'admin_email requerido' }, { status: 400 });
  }

  const isAdmin = await verifyAdminByEmail(admin_email);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await recalculateCommunityScores();

    const { error: logError } = await supabaseAdmin.from('automation_events').insert({
      event_name: 'community_scores_recalculated',
      status: 'ok',
      metadata: {
        updated: result.updated,
        windowStart: result.windowStart,
        windowEnd: result.windowEnd,
        triggeredBy: admin_email,
      },
    });
    if (logError) {
      console.error('[recalculate-scores] Failed to log success event:', logError);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[recalculate-scores]', err);

    await supabaseAdmin
      .from('automation_events')
      .insert({
        event_name: 'community_scores_recalculated',
        status: 'error',
        metadata: { error: message, triggeredBy: admin_email },
      })
      .then(undefined, (logErr) =>
        console.error('[recalculate-scores] Failed to log error event:', logErr),
      );

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

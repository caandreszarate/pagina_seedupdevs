import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const isAdmin = await verifyAdminByEmail(email);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [
    { count: totalLogs },
    { data: topUsers },
    { count: totalNudges },
    { data: recentEvents },
    { count: openOpportunities },
    { count: activeMentors },
    { data: orchestratorEvents, error: orchestratorEventsError },
    { count: totalVisitors },
    { count: activeVisitors },
    { count: verifiedVisitors },
    { data: recentVisitors },
    { data: tierRows },
    { data: latestNudgeRunRows },
    { data: recentNudgeRunRows },
    { data: connectionStatusRows },
    { data: latestMatchingRunRows },
    { data: latestConnectionRows },
  ] = await Promise.all([
    supabaseAdmin.from('discord_activity_logs').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('community_engagement_scores')
      .select('user_id, engagement_score, engagement_tier, users(nombres)')
      .order('engagement_score', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('discord_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'inactivity_nudge_sent'),
    supabaseAdmin
      .from('automation_events')
      .select('event_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('opportunity_matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabaseAdmin
      .from('mentor_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabaseAdmin
      .from('automation_events')
      .select('created_at, metadata')
      .eq('event_name', 'orchestrator_run')
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin.from('discord_visitors').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('discord_visitors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'visitor'),
    supabaseAdmin
      .from('discord_visitors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified'),
    supabaseAdmin
      .from('discord_visitors')
      .select('discord_username, status, first_seen_at, verified_at')
      .order('first_seen_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('community_engagement_scores')
      .select('engagement_tier'),
    supabaseAdmin
      .from('automation_events')
      .select('created_at, metadata')
      .eq('event_name', 'inactive_nudges_sent')
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin
      .from('automation_events')
      .select('metadata')
      .eq('event_name', 'inactive_nudges_sent')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabaseAdmin
      .from('opportunity_connections')
      .select('status, connection_type'),
    supabaseAdmin
      .from('automation_events')
      .select('created_at, metadata')
      .eq('event_name', 'opportunity_matching_run')
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin
      .from('opportunity_connections')
      .select('id, source_user_id, target_user_id, connection_type, score, reasons, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  type ScoreRow = { user_id: string; engagement_score: number; engagement_tier: string; users: { nombres: string } | null };
  type TierRow = { engagement_tier: string | null };
  type OrchestratorMeta = { ran: string[]; skipped: string[]; failed: string[] };
  type VisitorRow = { discord_username: string | null; status: string; first_seen_at: string; verified_at: string | null };
  type NudgeSegmentStats = { sent: number; skipped: number; failed: number };
  type NudgeRunMeta = {
    sent?: number;
    skipped?: number;
    failed?: number;
    count?: number; // legacy format pre-Sprint 5
    by_segment?: Record<string, NudgeSegmentStats>;
  };

  const lastOrchestrator = orchestratorEvents?.[0] ?? null;

  const EXPECTED_INTERVAL_MINUTES = 120;
  const GRACE_WINDOW_MINUTES = 30;

  type SchedulerStatus = 'healthy' | 'delayed' | 'missing';
  type SchedulerHealth = {
    lastRun: string | null;
    minutesSinceLastRun: number | null;
    // "missing" covers both no run found and inability to read scheduler state
    status: SchedulerStatus;
    expectedIntervalMinutes: number;
  };

  let schedulerHealth: SchedulerHealth;

  if (orchestratorEventsError) {
    console.error('[community-stats] Failed to query orchestrator events:', orchestratorEventsError);
    schedulerHealth = { lastRun: null, minutesSinceLastRun: null, status: 'missing', expectedIntervalMinutes: EXPECTED_INTERVAL_MINUTES };
  } else if (!lastOrchestrator) {
    schedulerHealth = { lastRun: null, minutesSinceLastRun: null, status: 'missing', expectedIntervalMinutes: EXPECTED_INTERVAL_MINUTES };
  } else {
    const minutesSinceLastRun = Math.floor(
      (Date.now() - new Date(lastOrchestrator.created_at).getTime()) / 60000,
    );
    schedulerHealth = {
      lastRun: lastOrchestrator.created_at,
      minutesSinceLastRun,
      status: minutesSinceLastRun <= EXPECTED_INTERVAL_MINUTES + GRACE_WINDOW_MINUTES ? 'healthy' : 'delayed',
      expectedIntervalMinutes: EXPECTED_INTERVAL_MINUTES,
    };
  }

  const latestNudgeRun = (latestNudgeRunRows ?? [])[0] ?? null;
  const nudgeLast7dRuns = (recentNudgeRunRows ?? []) as { metadata: NudgeRunMeta | null }[];

  const nudgeLast7d = nudgeLast7dRuns.reduce(
    (acc, row) => {
      const m = row.metadata;
      if (!m) return acc;
      acc.sent += m.sent ?? m.count ?? 0;
      acc.skipped += m.skipped ?? 0;
      acc.failed += m.failed ?? 0;
      return acc;
    },
    { sent: 0, skipped: 0, failed: 0 },
  );

  const nudgeBySegment: Record<string, NudgeSegmentStats> = {
    inactive: { sent: 0, skipped: 0, failed: 0 },
    'new-no-action': { sent: 0, skipped: 0, failed: 0 },
    'active-no-win': { sent: 0, skipped: 0, failed: 0 },
    'team-silent': { sent: 0, skipped: 0, failed: 0 },
  };
  for (const row of nudgeLast7dRuns) {
    const bs = (row.metadata as NudgeRunMeta | null)?.by_segment;
    if (!bs) continue;
    for (const seg of Object.keys(nudgeBySegment)) {
      if (bs[seg]) {
        nudgeBySegment[seg].sent += bs[seg].sent ?? 0;
        nudgeBySegment[seg].skipped += bs[seg].skipped ?? 0;
        nudgeBySegment[seg].failed += bs[seg].failed ?? 0;
      }
    }
  }

  // Opportunity matching analytics
  type ConnStatusRow = { status: string; connection_type: string };
  type ConnRow = {
    id: string;
    source_user_id: string;
    target_user_id: string;
    connection_type: string;
    score: number;
    reasons: string[];
    status: string;
    created_at: string;
  };

  const connRows = (connectionStatusRows ?? []) as ConnStatusRow[];
  const connectionByStatus = { suggested: 0, approved: 0, dismissed: 0, notified: 0 };
  const connectionByType: Record<string, number> = { mentor: 0, collaborator: 0, founder: 0, freelance: 0 };
  for (const row of connRows) {
    if (row.status in connectionByStatus) {
      connectionByStatus[row.status as keyof typeof connectionByStatus]++;
    }
    if (row.status === 'suggested' && row.connection_type in connectionByType) {
      connectionByType[row.connection_type]++;
    }
  }

  const latestMatchingRun = (latestMatchingRunRows ?? [])[0] ?? null;
  const latestConnections = (latestConnectionRows ?? []) as ConnRow[];

  // Batch-fetch user names for connections
  const connUserIds = new Set<string>();
  for (const c of latestConnections) {
    connUserIds.add(c.source_user_id);
    connUserIds.add(c.target_user_id);
  }
  const connUserNamesMap = new Map<string, string>();
  if (connUserIds.size > 0) {
    const { data: connUsers } = await supabaseAdmin
      .from('users')
      .select('id, nombres')
      .in('id', [...connUserIds]);
    for (const u of connUsers ?? []) {
      connUserNamesMap.set(u.id, u.nombres ?? 'Anónimo');
    }
  }

  return NextResponse.json({
    totalActivityLogs: totalLogs ?? 0,
    totalNudgesSent: totalNudges ?? 0,
    openOpportunities: openOpportunities ?? 0,
    activeMentorSessions: activeMentors ?? 0,
    topEngaged: (topUsers as unknown as ScoreRow[]).map((s) => ({
      nombres: s.users?.nombres ?? 'Anónimo',
      score: s.engagement_score,
      tier: s.engagement_tier ?? 'passive',
    })),
    tierDistribution: (tierRows as unknown as TierRow[]).reduce(
      (acc, row) => {
        const t = (row.engagement_tier ?? 'passive') as keyof typeof acc;
        if (t in acc) acc[t]++;
        return acc;
      },
      { passive: 0, active: 0, builder: 0, leader: 0 },
    ),
    recentAutomationEvents: recentEvents ?? [],
    orchestratorSummary: lastOrchestrator
      ? {
          lastRun: lastOrchestrator.created_at,
          ...(lastOrchestrator.metadata as OrchestratorMeta),
        }
      : null,
    visitors: {
      total: totalVisitors ?? 0,
      active: activeVisitors ?? 0,
      verified: verifiedVisitors ?? 0,
      recent: (recentVisitors ?? []) as VisitorRow[],
    },
    schedulerHealth,
    nudgeAnalytics: {
      lastRun: latestNudgeRun?.created_at ?? null,
      last7d: nudgeLast7d,
      by_segment: nudgeBySegment,
    },
    opportunityMatchingAnalytics: {
      lastRun: latestMatchingRun?.created_at ?? null,
      lastRunMeta: latestMatchingRun?.metadata ?? null,
      byStatus: connectionByStatus,
      byType: connectionByType,
      latestConnections: latestConnections.map((c) => ({
        id: c.id,
        source_user_name: connUserNamesMap.get(c.source_user_id) ?? 'Anónimo',
        target_user_name: connUserNamesMap.get(c.target_user_id) ?? 'Anónimo',
        connection_type: c.connection_type,
        score: c.score,
        reasons: c.reasons,
        status: c.status,
        created_at: c.created_at,
      })),
    },
  });
}

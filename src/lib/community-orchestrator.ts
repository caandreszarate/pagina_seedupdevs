import { supabaseAdmin } from '@/lib/supabase';
import {
  runDailySeed,
  runDailyChallenge,
  runDailyWins,
  runWeeklyRanking,
  runInactiveNudges,
  runWeeklyReset,
  runScanOpportunities,
} from '@/lib/community-actions';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

// Typed result — callers must handle the lock_query_failed case explicitly
type JobCheckResult =
  | { due: true }
  | { due: false; reason: 'already_ran' | 'legacy_event_found' }
  | { due: false; reason: 'lock_query_failed'; error: string };

/**
 * Checks automation_events to decide whether a job is due.
 * Also checks legacyEventName (individual cron events) to prevent duplication
 * during the migration from individual crons to the orchestrator.
 * On Supabase query error, returns lock_query_failed — do NOT assume the job should run.
 */
export async function shouldRunJob(
  jobName: string,
  intervalMs: number,
  legacyEventName?: string,
): Promise<JobCheckResult> {
  const names = legacyEventName ? [jobName, legacyEventName] : [jobName];

  const { data, error } = await supabaseAdmin
    .from('automation_events')
    .select('event_name, created_at')
    .in('event_name', names)
    .eq('status', 'ok')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    return { due: false, reason: 'lock_query_failed', error: error.message };
  }

  const lastEvent = data?.[0] ?? null;
  if (!lastEvent) return { due: true };

  const elapsed = Date.now() - new Date(lastEvent.created_at).getTime();
  if (elapsed < intervalMs) {
    const reason =
      lastEvent.event_name === jobName ? 'already_ran' : 'legacy_event_found';
    return { due: false, reason };
  }

  return { due: true };
}

/**
 * Inserts an automation_events row and throws if the Supabase insert fails.
 * Callers that log 'ok' status rely on this succeeding as the distributed lock.
 * Callers that log 'skipped' or 'error' should use logSafe (private) instead.
 */
export async function logOrchestratorEvent(
  jobName: string,
  status: 'ok' | 'error' | 'skipped',
  metadata: object | null = null,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('automation_events')
    .insert({ event_name: jobName, status, metadata });
  if (error) throw new Error(`automation_events insert failed: ${error.message}`);
}

export type OrchestratorResult = {
  ok: boolean;
  ran: string[];
  skipped: string[];
  failed: string[];
};

export async function runCommunityOrchestrator(): Promise<OrchestratorResult> {
  const ran: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  const loggingErrors: string[] = [];

  // Best-effort logger for skipped/error events — never throws, accumulates failures
  async function logSafe(
    name: string,
    status: 'skipped' | 'error',
    metadata: object | null,
  ): Promise<void> {
    try {
      await logOrchestratorEvent(name, status, metadata);
    } catch (err) {
      const msg = `log_failed:${name}:${status}`;
      console.error(`[orchestrator] ${msg}`, err);
      loggingErrors.push(msg);
    }
  }

  // Runs one job: resolves guard → executes fn → logs ok lock (propagates on failure)
  async function tryJob(
    name: string,
    intervalMs: number,
    fn: () => Promise<object>,
    legacyEventName?: string,
  ): Promise<void> {
    const check = await shouldRunJob(name, intervalMs, legacyEventName);

    if (!check.due && check.reason === 'lock_query_failed') {
      await logSafe(name, 'error', { reason: 'lock_query_failed', error: check.error });
      failed.push(name);
      return;
    }

    if (!check.due) {
      await logSafe(name, 'skipped', { reason: check.reason });
      skipped.push(name);
      return;
    }

    let jobResult: object;
    try {
      jobResult = await fn();
    } catch (err) {
      await logSafe(name, 'error', { error: (err as Error).message });
      failed.push(name);
      return;
    }

    // Job ran — log ok lock. If this fails the job is lost from history → mark as failed
    try {
      await logOrchestratorEvent(name, 'ok', jobResult);
      ran.push(name);
    } catch (logErr) {
      console.error(`[orchestrator] Failed to log ok for ${name}:`, logErr);
      await logSafe(name, 'error', {
        reason: 'job_completed_but_lock_log_failed',
        error: (logErr as Error).message,
      });
      failed.push(name);
    }
  }

  // ── Daily jobs ────────────────────────────────────────────────────────────
  await tryJob('orchestrator_daily_seed', DAY_MS, runDailySeed, 'daily_seed_sent');
  await tryJob('orchestrator_daily_challenge', DAY_MS, runDailyChallenge, 'daily_challenge_sent');
  await tryJob('orchestrator_daily_wins', DAY_MS, runDailyWins, 'daily_wins_sent');
  await tryJob('orchestrator_inactive_nudges', DAY_MS, runInactiveNudges, 'inactive_nudges_sent');

  // scan-opportunities: no legacy event — relies on internal duplicate prevention in runScanOpportunities
  await tryJob('orchestrator_scan_opportunities', 2 * HOUR_MS, runScanOpportunities);

  // ── Weekly ranking ────────────────────────────────────────────────────────
  await tryJob('orchestrator_weekly_ranking', WEEK_MS, runWeeklyRanking, 'weekly_ranking_sent');

  // ── Weekly reset — only after ranking has succeeded this week ─────────────
  // Pre-check ranking before evaluating reset's own guard.
  const rankingPrecheck = await shouldRunJob(
    'orchestrator_weekly_ranking',
    WEEK_MS,
    'weekly_ranking_sent',
  );

  if (!rankingPrecheck.due && rankingPrecheck.reason === 'lock_query_failed') {
    // Cannot verify ranking — treat reset as a failed operational dependency
    await logSafe('orchestrator_weekly_reset', 'error', {
      reason: 'ranking_lock_query_failed',
      dependency: 'orchestrator_weekly_ranking',
      error: rankingPrecheck.error,
    });
    failed.push('orchestrator_weekly_reset');
  } else if (rankingPrecheck.due) {
    // Ranking has not run this week — skip reset, not a failure
    await logSafe('orchestrator_weekly_reset', 'skipped', {
      reason: 'weekly_ranking_not_run_this_window',
    });
    skipped.push('orchestrator_weekly_reset');
  } else {
    // Ranking confirmed ran this week (already_ran or legacy_event_found)
    // Let tryJob handle reset's own guard + execution
    await tryJob(
      'orchestrator_weekly_reset',
      WEEK_MS,
      runWeeklyReset,
      'weekly_scores_reset',
    );
  }

  // ── Summary event (best-effort — never throws) ────────────────────────────
  try {
    await logOrchestratorEvent('orchestrator_run', 'ok', {
      ran,
      skipped,
      failed,
      loggingErrors,
    });
  } catch (err) {
    console.error('[orchestrator] Failed to log orchestrator_run summary:', err);
  }

  return { ok: true, ran, skipped, failed };
}

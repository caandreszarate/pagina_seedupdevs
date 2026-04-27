import { supabaseAdmin } from '@/lib/supabase';
import { sendChannelMessage } from '@/lib/discord';
import type { EventType } from '@/types/community';

export type NudgeSegment = 'inactive' | 'new-no-action' | 'active-no-win' | 'team-silent';

const SEGMENT_CAP = 5;
const COOLDOWN_DAYS = 7;
const NUDGE_EVENT: EventType = 'retention_nudge_sent';
const NUDGE_TYPES = new Set<string>(['retention_nudge_sent', 'inactivity_nudge_sent']);
const PRIORITY: NudgeSegment[] = ['inactive', 'new-no-action', 'team-silent', 'active-no-win'];

interface NudgeCandidate {
  user_id: string;
  discord_id: string;
  segment: NudgeSegment;
  reason: string;
}

export interface NudgeOutcome {
  segment: NudgeSegment;
  user_id: string;
  discord_id: string;
  status: 'sent' | 'failed';
  reason: string;
}

export interface NudgeRunResult {
  sent: number;
  skipped: number;
  failed: number;
  outcomes: NudgeOutcome[];
  by_segment: Record<NudgeSegment, { sent: number; skipped: number; failed: number }>;
}

type SegmentFn = (
  cooldownSet: Set<string>,
  excludeIds: Set<string>,
) => Promise<{ candidates: NudgeCandidate[]; skippedByCooldown: number }>;

function makeStats() {
  return { sent: 0, skipped: 0, failed: 0 };
}

function nudgeMessage(segment: NudgeSegment, discordId: string): string {
  switch (segment) {
    case 'inactive':
      return `Hey <@${discordId}> 👋 Hace un tiempo no te vemos por aquí. La comunidad te espera — ¿qué has estado construyendo?`;
    case 'new-no-action':
      return `Hola <@${discordId}> 🌱 Bienvenido/a a SeedUp Devs. Si tienes dudas o quieres presentarte, ¡nos encantaría conocerte!`;
    case 'active-no-win':
      return `<@${discordId}> 🏆 Has estado activo/a últimamente. ¿Tienes algún logro reciente para compartir? No importa qué tan pequeño — ¡aquí celebramos cada avance!`;
    case 'team-silent':
      return `Oye <@${discordId}> 🤝 Tu equipo está activo. ¿Cómo va el proyecto? Comparte un update cuando puedas.`;
  }
}

async function getActiveUserIds(since: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('discord_activity_logs')
    .select('user_id, event_type')
    .gte('created_at', since)
    .not('user_id', 'is', null);

  if (error) throw new Error(`Activity query failed: ${error.message}`);
  return new Set(
    (data ?? [])
      .filter((r) => !NUDGE_TYPES.has(r.event_type as string))
      .map((r) => r.user_id as string)
      .filter(Boolean),
  );
}

async function getCooldownSet(segment: NudgeSegment, since: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('discord_activity_logs')
    .select('user_id')
    .eq('event_type', NUDGE_EVENT)
    .filter('metadata->>segment', 'eq', segment)
    .gte('created_at', since)
    .not('user_id', 'is', null);

  if (error) throw new Error(`Cooldown query failed [${segment}]: ${error.message}`);
  return new Set((data ?? []).map((r) => r.user_id as string).filter(Boolean));
}

function makeInactiveFn(since14d: string): SegmentFn {
  return async (cooldownSet, excludeIds) => {
    const activeIds = await getActiveUserIds(since14d);
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, discord_id')
      .not('discord_id', 'is', null);

    if (error) throw new Error(`Users query failed [inactive]: ${error.message}`);

    const eligible = (users ?? []).filter((u) => !activeIds.has(u.id));
    const skippedByCooldown = eligible.filter(
      (u) => cooldownSet.has(u.id) && !excludeIds.has(u.id),
    ).length;
    const candidates = eligible
      .filter((u) => !cooldownSet.has(u.id) && !excludeIds.has(u.id))
      .slice(0, SEGMENT_CAP)
      .map((u) => ({
        user_id: u.id,
        discord_id: u.discord_id as string,
        segment: 'inactive' as NudgeSegment,
        reason: 'No activity in last 14 days',
      }));
    return { candidates, skippedByCooldown };
  };
}

function makeNewNoActionFn(since14d: string): SegmentFn {
  return async (cooldownSet, excludeIds) => {
    const { data: newUsers, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, discord_id, created_at')
      .not('discord_id', 'is', null)
      .gte('created_at', since14d);

    if (usersErr) throw new Error(`Users query failed [new-no-action]: ${usersErr.message}`);
    if (!newUsers?.length) return { candidates: [], skippedByCooldown: 0 };

    const ids = newUsers.map((u) => u.id);
    const { data: actRows, error: actErr } = await supabaseAdmin
      .from('discord_activity_logs')
      .select('user_id, event_type')
      .in('user_id', ids)
      .gte('created_at', since14d);

    if (actErr) throw new Error(`Activity query failed [new-no-action]: ${actErr.message}`);

    const activityCount: Record<string, number> = {};
    for (const r of actRows ?? []) {
      if (r.user_id && !NUDGE_TYPES.has(r.event_type as string)) {
        activityCount[r.user_id as string] = (activityCount[r.user_id as string] ?? 0) + 1;
      }
    }

    const eligible = newUsers.filter((u) => (activityCount[u.id] ?? 0) < 5);
    const skippedByCooldown = eligible.filter(
      (u) => cooldownSet.has(u.id) && !excludeIds.has(u.id),
    ).length;
    const candidates = eligible
      .filter((u) => !cooldownSet.has(u.id) && !excludeIds.has(u.id))
      .slice(0, SEGMENT_CAP)
      .map((u) => {
        const daysAgo = Math.floor((Date.now() - new Date(u.created_at as string).getTime()) / 86400000);
        return {
          user_id: u.id,
          discord_id: u.discord_id as string,
          segment: 'new-no-action' as NudgeSegment,
          reason: `Joined ${daysAgo}d ago, ${activityCount[u.id] ?? 0} events`,
        };
      });
    return { candidates, skippedByCooldown };
  };
}

function makeActiveNoWinFn(since14d: string): SegmentFn {
  return async (cooldownSet, excludeIds) => {
    const { data: scoreRows, error: scoreErr } = await supabaseAdmin
      .from('community_engagement_scores')
      .select('user_id')
      .in('engagement_tier', ['active', 'builder', 'leader']);

    if (scoreErr) throw new Error(`Scores query failed [active-no-win]: ${scoreErr.message}`);
    if (!scoreRows?.length) return { candidates: [], skippedByCooldown: 0 };

    const eligibleIds = scoreRows.map((r) => r.user_id as string);
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, discord_id')
      .in('id', eligibleIds)
      .not('discord_id', 'is', null);

    if (usersErr) throw new Error(`Users query failed [active-no-win]: ${usersErr.message}`);
    if (!users?.length) return { candidates: [], skippedByCooldown: 0 };

    const userIds = users.map((u) => u.id);
    const { data: winRows, error: winErr } = await supabaseAdmin
      .from('discord_activity_logs')
      .select('user_id, event_type, channel_name')
      .in('user_id', userIds)
      .gte('created_at', since14d);

    if (winErr) throw new Error(`Win signal query failed [active-no-win]: ${winErr.message}`);

    const hasWin = new Set(
      (winRows ?? [])
        .filter(
          (r) =>
            r.event_type === 'challenge_submit' ||
            (r.event_type === 'message' && r.channel_name === 'wins'),
        )
        .map((r) => r.user_id as string)
        .filter(Boolean),
    );

    const eligible = users.filter((u) => !hasWin.has(u.id));
    const skippedByCooldown = eligible.filter(
      (u) => cooldownSet.has(u.id) && !excludeIds.has(u.id),
    ).length;
    const candidates = eligible
      .filter((u) => !cooldownSet.has(u.id) && !excludeIds.has(u.id))
      .slice(0, SEGMENT_CAP)
      .map((u) => ({
        user_id: u.id,
        discord_id: u.discord_id as string,
        segment: 'active-no-win' as NudgeSegment,
        reason: 'Active/builder/leader with no win signal in last 14 days',
      }));
    return { candidates, skippedByCooldown };
  };
}

function makeTeamSilentFn(since7d: string): SegmentFn {
  return async (cooldownSet, excludeIds) => {
    const { data: members, error: membersErr } = await supabaseAdmin
      .from('team_members')
      .select('user_id');

    if (membersErr) throw new Error(`Team members query failed [team-silent]: ${membersErr.message}`);
    if (!members?.length) return { candidates: [], skippedByCooldown: 0 };

    const teamIds = members.map((m) => m.user_id as string);
    const { data: users, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id, discord_id')
      .in('id', teamIds)
      .not('discord_id', 'is', null);

    if (usersErr) throw new Error(`Users query failed [team-silent]: ${usersErr.message}`);
    if (!users?.length) return { candidates: [], skippedByCooldown: 0 };

    const activeIds = await getActiveUserIds(since7d);

    const eligible = users.filter((u) => !activeIds.has(u.id));
    const skippedByCooldown = eligible.filter(
      (u) => cooldownSet.has(u.id) && !excludeIds.has(u.id),
    ).length;
    const candidates = eligible
      .filter((u) => !cooldownSet.has(u.id) && !excludeIds.has(u.id))
      .slice(0, SEGMENT_CAP)
      .map((u) => ({
        user_id: u.id,
        discord_id: u.discord_id as string,
        segment: 'team-silent' as NudgeSegment,
        reason: 'Team member with no activity in last 7 days',
      }));
    return { candidates, skippedByCooldown };
  };
}

export async function runSmartNudges(): Promise<NudgeRunResult> {
  const channelId = process.env.DISCORD_CHANNEL_GENERAL_ID;
  const now = Date.now();
  const since14d = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const outcomes: NudgeOutcome[] = [];
  const nudgedThisRun = new Set<string>();
  const by_segment: Record<NudgeSegment, ReturnType<typeof makeStats>> = {
    inactive: makeStats(),
    'new-no-action': makeStats(),
    'active-no-win': makeStats(),
    'team-silent': makeStats(),
  };

  if (!channelId) {
    console.error('[nudges] DISCORD_CHANNEL_GENERAL_ID not set — aborting');
    return { sent: 0, skipped: 0, failed: 0, outcomes, by_segment };
  }

  const segmentFns: Record<NudgeSegment, SegmentFn> = {
    inactive: makeInactiveFn(since14d),
    'new-no-action': makeNewNoActionFn(since14d),
    'active-no-win': makeActiveNoWinFn(since14d),
    'team-silent': makeTeamSilentFn(since7d),
  };

  for (const segment of PRIORITY) {
    let cooldownSet: Set<string>;
    try {
      cooldownSet = await getCooldownSet(segment, since7d);
    } catch (err) {
      console.error(`[nudges] Cooldown query failed [${segment}]:`, err);
      by_segment[segment].skipped++;
      continue;
    }

    let candidates: NudgeCandidate[];
    let skippedByCooldown: number;
    try {
      const result = await segmentFns[segment](cooldownSet, nudgedThisRun);
      candidates = result.candidates;
      skippedByCooldown = result.skippedByCooldown;
      by_segment[segment].skipped += skippedByCooldown;
    } catch (err) {
      console.error(`[nudges] Candidates query failed [${segment}]:`, err);
      by_segment[segment].skipped++;
      continue;
    }

    for (const candidate of candidates) {
      if (nudgedThisRun.has(candidate.user_id)) {
        by_segment[segment].skipped++;
        continue;
      }

      let status: 'sent' | 'failed' = 'sent';
      try {
        await sendChannelMessage(channelId, nudgeMessage(candidate.segment, candidate.discord_id));
        nudgedThisRun.add(candidate.user_id);
        by_segment[segment].sent++;
      } catch {
        status = 'failed';
        by_segment[segment].failed++;
      }

      try {
        await supabaseAdmin.from('discord_activity_logs').insert({
          discord_id: candidate.discord_id,
          user_id: candidate.user_id,
          event_type: NUDGE_EVENT,
          metadata: { segment: candidate.segment, reason: candidate.reason, status },
        });
      } catch (err) {
        console.error(`[nudges] Log failed [${candidate.user_id}]:`, err);
      }

      outcomes.push({
        segment: candidate.segment,
        user_id: candidate.user_id,
        discord_id: candidate.discord_id,
        status,
        reason: candidate.reason,
      });
    }
  }

  const sent = outcomes.filter((o) => o.status === 'sent').length;
  const failed = outcomes.filter((o) => o.status === 'failed').length;
  const skipped = Object.values(by_segment).reduce((s, v) => s + v.skipped, 0);

  try {
    await supabaseAdmin.from('automation_events').insert({
      event_name: 'inactive_nudges_sent',
      status: 'ok',
      metadata: { sent, skipped, failed, by_segment },
    });
  } catch (err) {
    console.error('[nudges] Failed to log run summary:', err);
  }

  return { sent, skipped, failed, outcomes, by_segment };
}

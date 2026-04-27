import { supabaseAdmin } from '@/lib/supabase';
import type { EventType } from '@/types/community';

export const ENGAGEMENT_POINTS: Record<EventType, number> = {
  message: 2,
  reaction: 1,
  mention: 2,
  join_voice: 3,
  challenge_submit: 8,
  member_join: 0,
  inactivity_nudge_sent: 0,
  retention_nudge_sent: 0,
};

export type EngagementTier = 'passive' | 'active' | 'builder' | 'leader';

export interface WeeklyBreakdown {
  weekly_messages: number;
  weekly_reactions: number;
  weekly_challenges: number;
  weekly_voice: number;
  weekly_mentions: number;
}

export function getMeaningfulContributionCount(breakdown: WeeklyBreakdown): number {
  let count = 0;
  if (breakdown.weekly_messages > 0) count++;
  if (breakdown.weekly_mentions > 0) count++;
  if (breakdown.weekly_voice > 0) count++;
  if (breakdown.weekly_challenges > 0) count++;
  return count;
}

export function calculateEngagementTier(score: number, breakdown: WeeklyBreakdown): EngagementTier {
  const meaningful = getMeaningfulContributionCount(breakdown);
  if (score >= 60 && meaningful >= 2) return 'leader';
  if (score >= 30 && meaningful >= 1) return 'builder';
  if (score >= 10) return 'active';
  return 'passive';
}

export function calculateEngagementScoreBreakdown(
  eventCounts: Partial<Record<EventType, number>>,
): {
  totalScore: number;
  byType: Partial<Record<EventType, { count: number; points: number }>>;
} {
  let totalScore = 0;
  const byType: Partial<Record<EventType, { count: number; points: number }>> = {};
  for (const [eventType, count] of Object.entries(eventCounts) as [EventType, number][]) {
    const weight = ENGAGEMENT_POINTS[eventType] ?? 0;
    const points = weight * count;
    totalScore += points;
    if (count > 0) byType[eventType] = { count, points };
  }
  return { totalScore, byType };
}

export async function recalculateCommunityScores(): Promise<{
  updated: number;
  windowStart: string;
  windowEnd: string;
}> {
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowStartISO = windowStart.toISOString();
  const windowEndISO = windowEnd.toISOString();
  const now = windowEndISO;

  const { data: logs, error: logsError } = await supabaseAdmin
    .from('discord_activity_logs')
    .select('user_id, event_type')
    .not('user_id', 'is', null)
    .gte('created_at', windowStartISO)
    .lte('created_at', windowEndISO);

  if (logsError) throw new Error(`Failed to fetch activity logs: ${logsError.message}`);

  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from('community_engagement_scores')
    .select('user_id');

  if (existingError) throw new Error(`Failed to fetch existing scores: ${existingError.message}`);

  const userEventCounts = new Map<string, Partial<Record<EventType, number>>>();
  for (const log of logs ?? []) {
    if (!log.user_id) continue;
    const current = userEventCounts.get(log.user_id) ?? {};
    const eventType = log.event_type as EventType;
    current[eventType] = (current[eventType] ?? 0) + 1;
    userEventCounts.set(log.user_id, current);
  }

  const allUserIds = new Set<string>([
    ...userEventCounts.keys(),
    ...(existingRows ?? []).map((r: { user_id: string }) => r.user_id),
  ]);

  const upsertRows: Record<string, unknown>[] = [];
  for (const userId of allUserIds) {
    const counts = userEventCounts.get(userId) ?? {};
    const breakdown: WeeklyBreakdown = {
      weekly_messages: counts.message ?? 0,
      weekly_reactions: counts.reaction ?? 0,
      weekly_challenges: counts.challenge_submit ?? 0,
      weekly_voice: counts.join_voice ?? 0,
      weekly_mentions: counts.mention ?? 0,
    };
    const { totalScore } = calculateEngagementScoreBreakdown(counts);
    const tier = calculateEngagementTier(totalScore, breakdown);
    upsertRows.push({
      user_id: userId,
      ...breakdown,
      engagement_score: totalScore,
      engagement_tier: tier,
      last_calculated_at: now,
    });
  }

  if (upsertRows.length === 0) {
    return { updated: 0, windowStart: windowStartISO, windowEnd: windowEndISO };
  }

  const { error: upsertError } = await supabaseAdmin
    .from('community_engagement_scores')
    .upsert(upsertRows, { onConflict: 'user_id' });

  if (upsertError) throw new Error(`Failed to upsert scores: ${upsertError.message}`);

  return { updated: upsertRows.length, windowStart: windowStartISO, windowEnd: windowEndISO };
}

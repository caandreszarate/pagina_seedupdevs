import { supabaseAdmin } from '@/lib/supabase';
import type { OpportunityType } from '@/types/community';

type Nivel = 'dev-zero' | 'dev-bronce' | 'dev-silver' | 'dev-gold' | 'dev-platinum';
const NIVEL_ORDER: Nivel[] = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];

export type ConnectionStatus = 'suggested' | 'approved' | 'dismissed' | 'notified';
const ACTIVE_STATUSES: ConnectionStatus[] = ['suggested', 'approved', 'notified'];

// Scoring weights — documented in CLAUDE.md
const SCORE_BASE = 30;           // oportunidad del tipo detectada
const SCORE_COMPLEMENTARY = 25;  // tier del candidato complementa el tipo de búsqueda
const SCORE_TIER_BONUS = 15;     // candidato es active/builder/leader
const SCORE_RECENT_ACTIVITY = 10; // actividad en Discord en últimos 7 días
const SCORE_LEVEL_COMPAT = 10;   // nivel compatible (±1 posición)
const SCORE_SHARED_INTEREST = 10; // candidato tiene oportunidad abierta del mismo tipo

// Tiers que se consideran complementarios por tipo de oportunidad
const COMPLEMENTARY_TIERS: Record<OpportunityType, string[]> = {
  mentor: ['builder', 'leader'],
  collaborator: ['active', 'builder', 'leader'],
  founder: ['active', 'builder', 'leader'],
  freelance: ['active', 'builder', 'leader'],
};

const MAX_PER_OPPORTUNITY = 3;

interface UserProfile {
  id: string;
  nombres: string | null;
  current_level: string | null;
  engagement_score: number;
  engagement_tier: string;
  open_opportunity_types: Set<OpportunityType>;
  has_recent_activity: boolean;
}

interface OpportunityRow {
  id: string;
  user_id: string;
  opportunity_type: OpportunityType;
  notes: string | null;
}

export type ByType = Record<OpportunityType, { created: number; skipped: number; failed: number }>;

function emptyByType(): ByType {
  return {
    mentor: { created: 0, skipped: 0, failed: 0 },
    collaborator: { created: 0, skipped: 0, failed: 0 },
    founder: { created: 0, skipped: 0, failed: 0 },
    freelance: { created: 0, skipped: 0, failed: 0 },
  };
}

function scoreCandidate(
  source: UserProfile,
  target: UserProfile,
  opportunityType: OpportunityType,
): { score: number; reasons: string[] } {
  let score = SCORE_BASE;
  const reasons: string[] = [`Oportunidad de tipo "${opportunityType}" detectada`];

  if (COMPLEMENTARY_TIERS[opportunityType].includes(target.engagement_tier)) {
    score += SCORE_COMPLEMENTARY;
    reasons.push(`Perfil ${target.engagement_tier} complementa la búsqueda`);
  }

  if (['active', 'builder', 'leader'].includes(target.engagement_tier)) {
    score += SCORE_TIER_BONUS;
    reasons.push('Candidato activo en la comunidad');
  }

  if (target.has_recent_activity) {
    score += SCORE_RECENT_ACTIVITY;
    reasons.push('Actividad reciente en Discord');
  }

  if (source.current_level && target.current_level) {
    const srcIdx = NIVEL_ORDER.indexOf(source.current_level as Nivel);
    const tgtIdx = NIVEL_ORDER.indexOf(target.current_level as Nivel);
    if (srcIdx >= 0 && tgtIdx >= 0 && Math.abs(tgtIdx - srcIdx) <= 1) {
      score += SCORE_LEVEL_COMPAT;
      reasons.push('Nivel compatible');
    }
  }

  if (target.open_opportunity_types.has(opportunityType)) {
    score += SCORE_SHARED_INTEREST;
    reasons.push('Interés mutuo en el mismo tipo de oportunidad');
  }

  return { score, reasons };
}

function connKey(oppId: string, srcId: string, tgtId: string, type: string): string {
  return `${oppId}:${srcId}:${tgtId}:${type}`;
}

export async function runOpportunityMatching(): Promise<{
  created: number;
  skipped: number;
  failed: number;
  by_type: ByType;
  errors: string[];
}> {
  const by_type = emptyByType();
  const errors: string[] = [];
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // 1. Fetch all open opportunities — fail hard if this query fails
  const { data: opportunities, error: oppError } = await supabaseAdmin
    .from('opportunity_matches')
    .select('id, user_id, opportunity_type, notes')
    .eq('status', 'open');

  if (oppError) {
    const msg = `Failed to fetch opportunities: ${oppError.message}`;
    await logRun({ created: 0, skipped: 0, failed: 0, by_type, errors: [msg] });
    throw new Error(msg);
  }

  if (!opportunities || opportunities.length === 0) {
    await logRun({ created: 0, skipped: 0, failed: 0, by_type, errors });
    return { created: 0, skipped: 0, failed: 0, by_type, errors };
  }

  // 2. Fetch all users (basic profile)
  const { data: allUsers, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, nombres, current_level');

  if (usersError) {
    const msg = `Failed to fetch users: ${usersError.message}`;
    await logRun({ created: 0, skipped: 0, failed: 0, by_type, errors: [msg] });
    throw new Error(msg);
  }

  // 3. Fetch engagement scores (separate query — avoids complex FK aliasing)
  const { data: scores } = await supabaseAdmin
    .from('community_engagement_scores')
    .select('user_id, engagement_score, engagement_tier');

  const scoreMap = new Map<string, { engagement_score: number; engagement_tier: string }>();
  for (const s of scores ?? []) {
    scoreMap.set(s.user_id, {
      engagement_score: s.engagement_score,
      engagement_tier: s.engagement_tier,
    });
  }

  // 4. Fetch user IDs with recent activity (last 7 days)
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogs } = await supabaseAdmin
    .from('discord_activity_logs')
    .select('user_id')
    .not('user_id', 'is', null)
    .gte('created_at', cutoff);

  const recentIds = new Set((recentLogs ?? []).map((r) => r.user_id as string));

  // 5. Build open-opportunity-types index per user (for shared-interest scoring)
  const oppsByUser = new Map<string, Set<OpportunityType>>();
  for (const opp of opportunities as OpportunityRow[]) {
    if (!oppsByUser.has(opp.user_id)) oppsByUser.set(opp.user_id, new Set());
    oppsByUser.get(opp.user_id)!.add(opp.opportunity_type);
  }

  // 6. Build user profiles
  const profiles = new Map<string, UserProfile>();
  for (const user of allUsers ?? []) {
    const score = scoreMap.get(user.id);
    profiles.set(user.id, {
      id: user.id,
      nombres: user.nombres ?? null,
      current_level: user.current_level ?? null,
      engagement_score: score?.engagement_score ?? 0,
      engagement_tier: score?.engagement_tier ?? 'passive',
      open_opportunity_types: oppsByUser.get(user.id) ?? new Set(),
      has_recent_activity: recentIds.has(user.id),
    });
  }

  // 7. Fetch existing active connections — used to skip duplicates
  const { data: existingConns } = await supabaseAdmin
    .from('opportunity_connections')
    .select('opportunity_id, source_user_id, target_user_id, connection_type')
    .in('status', ACTIVE_STATUSES);

  type ConnRow = {
    opportunity_id: string | null;
    source_user_id: string;
    target_user_id: string;
    connection_type: string;
  };

  const existingKeys = new Set(
    (existingConns ?? []).map((c: ConnRow) =>
      connKey(c.opportunity_id ?? '', c.source_user_id, c.target_user_id, c.connection_type),
    ),
  );

  // 8. Process each opportunity
  for (const opp of opportunities as OpportunityRow[]) {
    const sourceProfile = profiles.get(opp.user_id);
    if (!sourceProfile) continue;

    const candidates: { profile: UserProfile; score: number; reasons: string[] }[] = [];

    for (const [userId, profile] of profiles) {
      if (userId === opp.user_id) continue; // never match with self
      const { score, reasons } = scoreCandidate(sourceProfile, profile, opp.opportunity_type);
      if (score > SCORE_BASE) { // require at least one signal beyond the base
        candidates.push({ profile, score, reasons });
      }
    }

    // Sort by score desc, take top N
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, MAX_PER_OPPORTUNITY);

    for (const candidate of top) {
      const key = connKey(opp.id, opp.user_id, candidate.profile.id, opp.opportunity_type);

      if (existingKeys.has(key)) {
        totalSkipped++;
        by_type[opp.opportunity_type].skipped++;
        continue;
      }

      try {
        const { error: insertError } = await supabaseAdmin
          .from('opportunity_connections')
          .insert({
            opportunity_id: opp.id,
            source_user_id: opp.user_id,
            target_user_id: candidate.profile.id,
            connection_type: opp.opportunity_type,
            score: candidate.score,
            reasons: candidate.reasons,
            status: 'suggested',
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          totalFailed++;
          by_type[opp.opportunity_type].failed++;
          errors.push(`opp=${opp.id} tgt=${candidate.profile.id}: ${insertError.message}`);
        } else {
          totalCreated++;
          by_type[opp.opportunity_type].created++;
          existingKeys.add(key); // prevent in-run duplicates
        }
      } catch (err) {
        totalFailed++;
        by_type[opp.opportunity_type].failed++;
        errors.push(`unexpected opp=${opp.id} tgt=${candidate.profile.id}: ${(err as Error).message}`);
      }
    }
  }

  await logRun({ created: totalCreated, skipped: totalSkipped, failed: totalFailed, by_type, errors });

  return { created: totalCreated, skipped: totalSkipped, failed: totalFailed, by_type, errors };
}

async function logRun(result: {
  created: number;
  skipped: number;
  failed: number;
  by_type: ByType;
  errors: string[];
}): Promise<void> {
  const metadata: Record<string, unknown> = {
    created: result.created,
    skipped: result.skipped,
    failed: result.failed,
    by_type: result.by_type,
  };
  if (result.errors.length > 0) metadata.errors = result.errors.slice(0, 10);

  await supabaseAdmin.from('automation_events').insert({
    event_name: 'opportunity_matching_run',
    status: result.failed > 0 && result.created === 0 ? 'error' : 'ok',
    metadata,
  });
}

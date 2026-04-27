import { supabaseAdmin } from '@/lib/supabase';
import {
  sendDailyPrompt,
  sendChallengePrompt,
  sendWinsPrompt,
  sendDiscordMessage,
  sendOpportunityMessage,
} from '@/lib/discord';
import { runSmartNudges } from '@/lib/community-nudges';
import {
  generateDailySeedPrompt,
  generateDailyChallengePrompt,
  generateWinPrompt,
  generateWeeklyLeaderboardMessage,
} from '@/lib/community-manager';
import type { OpportunityType } from '@/types/community';

export async function runDailySeed(): Promise<{ ok: boolean }> {
  const content = generateDailySeedPrompt();
  await sendDailyPrompt(content);
  await supabaseAdmin.from('automation_events').insert({
    event_name: 'daily_seed_sent',
    status: 'ok',
    metadata: { prompt: content },
  });
  return { ok: true };
}

export async function runDailyChallenge(): Promise<{ ok: boolean }> {
  const content = generateDailyChallengePrompt();
  await sendChallengePrompt(content);
  await supabaseAdmin.from('automation_events').insert({
    event_name: 'daily_challenge_sent',
    status: 'ok',
    metadata: { prompt: content },
  });
  return { ok: true };
}

export async function runDailyWins(): Promise<{ ok: boolean }> {
  const content = generateWinPrompt();
  await sendWinsPrompt(content);
  await supabaseAdmin.from('automation_events').insert({
    event_name: 'daily_wins_sent',
    status: 'ok',
    metadata: { prompt: content },
  });
  return { ok: true };
}

export async function runWeeklyRanking(): Promise<{ ok: boolean; count: number }> {
  const { data: scores, error } = await supabaseAdmin
    .from('community_engagement_scores')
    .select('user_id, engagement_score, users(nombres)')
    .order('engagement_score', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);

  type ScoreRow = { user_id: string; engagement_score: number; users: { nombres: string } | null };

  const rankings = (scores as unknown as ScoreRow[]).map((s, i) => ({
    nombres: s.users?.nombres ?? 'Anónimo',
    score: s.engagement_score,
    position: i + 1,
  }));

  if (rankings.length > 0) {
    const msg = generateWeeklyLeaderboardMessage(rankings);
    await sendDiscordMessage(msg);
  }

  await supabaseAdmin.from('automation_events').insert({
    event_name: 'weekly_ranking_sent',
    status: 'ok',
    metadata: { top: rankings.length },
  });

  return { ok: true, count: rankings.length };
}

export async function runInactiveNudges(): Promise<{ ok: boolean; nudged: number }> {
  const result = await runSmartNudges();
  return { ok: true, nudged: result.sent };
}

export async function runWeeklyReset(): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin
    .from('community_engagement_scores')
    .update({
      weekly_messages: 0,
      weekly_reactions: 0,
      weekly_challenges: 0,
      weekly_voice: 0,
    })
    .gte('user_id', '00000000-0000-0000-0000-000000000000');

  if (error) throw new Error(error.message);

  await supabaseAdmin.from('automation_events').insert({
    event_name: 'weekly_scores_reset',
    status: 'ok',
    metadata: null,
  });

  return { ok: true };
}

const KEYWORDS: Record<OpportunityType, string[]> = {
  freelance: [
    'freelance', 'trabajo freelance', 'busco trabajo', 'busco cliente',
    'clientes', 'proyecto pago', 'paid project', 'client work',
  ],
  founder: [
    'cofounder', 'co-founder', 'socio', 'socio técnico',
    'startup', 'fundador',
  ],
  mentor: [
    'mentor', 'mentoría', 'ayuda con', 'necesito ayuda',
    'quién me ayuda', 'guía', 'guidance',
  ],
  collaborator: [
    'colaborar', 'colaboración', 'equipo', 'partner',
    'construir juntos', 'open source',
  ],
};

function detectOpportunityType(content: string): OpportunityType | null {
  const lower = content.toLowerCase();
  for (const [type, keywords] of Object.entries(KEYWORDS) as [OpportunityType, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return null;
}

async function hasDuplicateOpportunity(
  userId: string,
  opportunityType: OpportunityType,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from('opportunity_matches')
    .select('id')
    .eq('user_id', userId)
    .eq('opportunity_type', opportunityType)
    .eq('status', 'open')
    .gte('created_at', cutoff)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function runScanOpportunities(): Promise<{
  ok: boolean;
  scanned: number;
  created: number;
  skippedDuplicates: number;
  matches: { user_id: string; opportunity_type: OpportunityType; notes: string }[];
}> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: logs, error: logsError } = await supabaseAdmin
    .from('discord_activity_logs')
    .select('id, user_id, channel_name, metadata, created_at')
    .eq('event_type', 'message')
    .gte('created_at', cutoff)
    .not('user_id', 'is', null);

  if (logsError) throw new Error(logsError.message);

  let scanned = 0;
  let created = 0;
  let skippedDuplicates = 0;
  const matches: { user_id: string; opportunity_type: OpportunityType; notes: string }[] = [];

  for (const log of logs ?? []) {
    const content = (log.metadata as { content?: string } | null)?.content;
    if (!content || !log.user_id) continue;

    scanned++;

    const opportunityType = detectOpportunityType(content);
    if (!opportunityType) continue;

    const isDuplicate = await hasDuplicateOpportunity(log.user_id as string, opportunityType);
    if (isDuplicate) {
      skippedDuplicates++;
      continue;
    }

    const notes = `[${log.channel_name ?? 'unknown'}] ${content}`.slice(0, 500);

    const { error: insertError } = await supabaseAdmin.from('opportunity_matches').insert({
      user_id: log.user_id,
      opportunity_type: opportunityType,
      notes,
      status: 'open',
    });

    if (!insertError) {
      created++;
      matches.push({ user_id: log.user_id as string, opportunity_type: opportunityType, notes });

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('discord_id')
        .eq('id', log.user_id as string)
        .single();

      if (userData?.discord_id) {
        try {
          await sendOpportunityMessage({
            userDiscordId: userData.discord_id,
            opportunityType,
            notes: content,
            channelName: log.channel_name ?? 'unknown',
          });
        } catch (discordErr) {
          console.error('[scan-opportunities] Error publicando en Discord:', discordErr);
          await supabaseAdmin.from('automation_events').insert({
            event_name: 'opportunity_discord_post_failed',
            status: 'error',
            metadata: { user_id: log.user_id, opportunity_type: opportunityType },
          });
        }
      }
    }
  }

  return { ok: true, scanned, created, skippedDuplicates, matches };
}

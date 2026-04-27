import { supabaseAdmin } from '@/lib/supabase';
import type { EventType, ActivityMetadata } from '@/types/community';
import { ENGAGEMENT_POINTS, calculateEngagementTier } from '@/lib/community-scoring';
import type { WeeklyBreakdown } from '@/lib/community-scoring';
import { generateInactivityMessage } from '@/lib/community-manager';

const DISCORD_API = 'https://discord.com/api/v10';
const VIEW_CHANNEL = '1024';

function botHeaders(): Record<string, string> {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN ?? ''}`,
    'Content-Type': 'application/json',
  };
}

async function discordRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(`${DISCORD_API}${path}`, {
      method,
      headers: botHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[discord] ${method} ${path} (${res.status}):`, err);
      return { ok: false, data: null };
    }
    return { ok: true, data: res.status === 204 ? null : await res.json() };
  } catch (err) {
    console.error(`[discord] Error de red ${method} ${path}:`, err);
    return { ok: false, data: null };
  }
}

export async function sendDiscordMessage(content: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_LOGROS_ID;

  if (!token || !channelId) {
    console.error('[discord] DISCORD_BOT_TOKEN o DISCORD_CHANNEL_LOGROS_ID no configurados');
    return;
  }

  try {
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`[discord] Error al enviar mensaje (${res.status}):`, error);
    }
  } catch (err) {
    console.error('[discord] Error de red:', err);
  }
}

export async function sendChannelMessage(channelId: string, content: string): Promise<void> {
  await discordRequest('POST', `/channels/${channelId}/messages`, { content });
}

import type { Project } from '@/lib/projects';

export async function createDiscordTeamSpace(
  teamName: string,
  memberDiscordIds: string[],
  level: string,
  project: Project,
): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !token) {
    console.error('[discord] DISCORD_GUILD_ID o DISCORD_BOT_TOKEN no configurados');
    return;
  }

  const permissionOverwrites = [
    { id: guildId, type: 0, deny: VIEW_CHANNEL, allow: '0' },
    ...memberDiscordIds.map((id) => ({ id, type: 1, allow: VIEW_CHANNEL, deny: '0' })),
  ];

  const { ok: catOk, data: catData } = await discordRequest(
    'POST',
    `/guilds/${guildId}/channels`,
    { name: `Team ${teamName}`, type: 4, permission_overwrites: permissionOverwrites },
  );
  if (!catOk) return;

  const categoryId = (catData as { id: string }).id;

  let generalChannelId: string | null = null;
  for (const chName of ['general', 'daily', 'entregables']) {
    const { ok, data } = await discordRequest('POST', `/guilds/${guildId}/channels`, {
      name: chName,
      type: 0,
      parent_id: categoryId,
    });
    if (ok && chName === 'general') {
      generalChannelId = (data as { id: string }).id;
    }
  }

  if (generalChannelId) {
    const msg = [
      `🚀 NUEVO EQUIPO CREADO`,
      ``,
      `👥 Equipo: ${teamName}`,
      `🧠 Nivel: ${level}`,
      ``,
      `📦 PROYECTO ASIGNADO:`,
      `${project.name}`,
      ``,
      `📝 Descripción:`,
      `${project.description}`,
      ``,
      `🛠 Stack sugerido:`,
      `${project.team_scope.stack}`,
      ``,
      `🎯 RESPONSABILIDADES:`,
      ``,
      `Frontend:`,
      `${project.team_scope.frontend}`,
      ``,
      `Backend:`,
      `${project.team_scope.backend}`,
      ``,
      `Extra:`,
      `${project.team_scope.extra}`,
      ``,
      `🔗 Repo: ${project.repo_url ?? 'Por definir'}`,
      `🎨 Figma: ${project.figma_url ?? 'Por definir'}`,
      ``,
      `📅 REGLAS:`,
      `- Daily async obligatorio`,
      `- Entrega semanal`,
      `- Demo final`,
    ].join('\n');
    await sendChannelMessage(generalChannelId, msg);
  }
}

export async function logDiscordActivity(params: {
  discordId: string;
  eventType: EventType;
  channelName?: string;
  metadata?: ActivityMetadata;
}): Promise<void> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('discord_id', params.discordId)
    .single();

  await supabaseAdmin.from('discord_activity_logs').insert({
    discord_id: params.discordId,
    user_id: user?.id ?? null,
    event_type: params.eventType,
    channel_name: params.channelName ?? null,
    metadata: params.metadata ?? null,
  });

  if (user?.id) {
    await incrementEngagementScore(user.id, params.eventType);
  }
}

export async function incrementEngagementScore(userId: string, eventType: EventType): Promise<void> {
  const points = ENGAGEMENT_POINTS[eventType];

  const colMap: Partial<Record<EventType, keyof WeeklyBreakdown>> = {
    message: 'weekly_messages',
    reaction: 'weekly_reactions',
    challenge_submit: 'weekly_challenges',
    join_voice: 'weekly_voice',
    mention: 'weekly_mentions',
  };

  const col = colMap[eventType];

  const { data: existing } = await supabaseAdmin
    .from('community_engagement_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const newBreakdown: WeeklyBreakdown = {
      weekly_messages: (existing.weekly_messages ?? 0) + (col === 'weekly_messages' ? 1 : 0),
      weekly_reactions: (existing.weekly_reactions ?? 0) + (col === 'weekly_reactions' ? 1 : 0),
      weekly_challenges: (existing.weekly_challenges ?? 0) + (col === 'weekly_challenges' ? 1 : 0),
      weekly_voice: (existing.weekly_voice ?? 0) + (col === 'weekly_voice' ? 1 : 0),
      weekly_mentions: (existing.weekly_mentions ?? 0) + (col === 'weekly_mentions' ? 1 : 0),
    };
    const newScore = existing.engagement_score + points;
    const update: Record<string, unknown> = {
      engagement_score: newScore,
      engagement_tier: calculateEngagementTier(newScore, newBreakdown),
      last_calculated_at: new Date().toISOString(),
    };
    if (col) update[col] = newBreakdown[col];
    await supabaseAdmin
      .from('community_engagement_scores')
      .update(update)
      .eq('user_id', userId);
  } else {
    const newBreakdown: WeeklyBreakdown = {
      weekly_messages: col === 'weekly_messages' ? 1 : 0,
      weekly_reactions: col === 'weekly_reactions' ? 1 : 0,
      weekly_challenges: col === 'weekly_challenges' ? 1 : 0,
      weekly_voice: col === 'weekly_voice' ? 1 : 0,
      weekly_mentions: col === 'weekly_mentions' ? 1 : 0,
    };
    await supabaseAdmin.from('community_engagement_scores').insert({
      user_id: userId,
      ...newBreakdown,
      engagement_score: points,
      engagement_tier: calculateEngagementTier(points, newBreakdown),
      last_calculated_at: new Date().toISOString(),
    });
  }
}

export async function sendInactivityNudge(discordId: string, userName: string): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_GENERAL_ID;
  if (!channelId) {
    console.error('[discord] DISCORD_CHANNEL_GENERAL_ID no configurado');
    return;
  }
  const msg = generateInactivityMessage(discordId, userName);
  await sendChannelMessage(channelId, msg);
}

export async function sendDailyPrompt(content: string): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_DAILY_ID;
  if (!channelId) {
    console.error('[discord] DISCORD_CHANNEL_DAILY_ID no configurado');
    return;
  }
  await sendChannelMessage(channelId, content);
}

export async function sendChallengePrompt(content: string): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_RETOS_ID;
  if (!channelId) {
    console.error('[discord] DISCORD_CHANNEL_RETOS_ID no configurado');
    return;
  }
  await sendChannelMessage(channelId, content);
}

export async function sendWinsPrompt(content: string): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_WINS_ID;
  if (!channelId) {
    console.error('[discord] DISCORD_CHANNEL_WINS_ID no configurado');
    return;
  }
  await sendChannelMessage(channelId, content);
}

const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  freelance: 'Freelance',
  founder: 'Co-founder / Socio',
  mentor: 'Mentoría',
  collaborator: 'Colaboración',
};

export async function sendOpportunityMessage(params: {
  userDiscordId: string;
  opportunityType: string;
  notes: string;
  channelName: string;
}): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_OPPORTUNITIES_ID;
  if (!channelId) {
    console.error('[discord] DISCORD_CHANNEL_OPPORTUNITIES_ID no configurado');
    return;
  }

  const typeLabel = OPPORTUNITY_TYPE_LABELS[params.opportunityType] ?? params.opportunityType;

  const msg = [
    `💼 **Nueva oportunidad detectada**`,
    ``,
    `👤 Usuario: <@${params.userDiscordId}>`,
    `📌 Tipo: ${typeLabel}`,
    `📍 Canal origen: #${params.channelName}`,
    `💬 Mensaje:`,
    `"${params.notes}"`,
    ``,
    `Responde en este hilo si puedes ayudar o quieres conectar.`,
  ].join('\n');

  await sendChannelMessage(channelId, msg);
}

export async function assignVisitorRole(discordId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_VISITOR;
  if (!guildId || !roleId) return false;
  const { ok } = await discordRequest(
    'PUT',
    `/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
  );
  return ok;
}

export async function removeVisitorRole(discordId: string): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_VISITOR;
  if (!guildId || !roleId) return false;
  const { ok } = await discordRequest(
    'DELETE',
    `/guilds/${guildId}/members/${discordId}/roles/${roleId}`,
  );
  return ok;
}

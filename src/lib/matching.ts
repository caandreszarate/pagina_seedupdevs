import { supabaseAdmin } from '@/lib/supabase';
import { createDiscordTeamSpace, sendDiscordMessage } from '@/lib/discord';
import { getProjectForLevel } from '@/lib/projects';

type EligibleApp = {
  id: string;
  user_id: string;
  level: string;
  users: { discord_id: string; nombres: string } | null;
};

function splitIntoGroups<T>(items: T[]): T[][] {
  const n = items.length;
  if (n < 3) return [];
  const numGroups = Math.ceil(n / 5);
  const baseSize = Math.floor(n / numGroups);
  const remainder = n % numGroups;
  const groups: T[][] = [];
  let idx = 0;
  for (let i = 0; i < numGroups; i++) {
    const size = i < remainder ? baseSize + 1 : baseSize;
    groups.push(items.slice(idx, idx + size));
    idx += size;
  }
  return groups;
}

async function getNextTeamNumber(): Promise<number> {
  const { data } = await supabaseAdmin.from('teams').select('name').like('name', 'Team-%');
  let max = 0;
  for (const team of data ?? []) {
    const m = (team.name as string).match(/^Team-(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

export type MatchResult = {
  teamsFormed: number;
  teamsSkipped: number;
  errors: string[];
};

export async function matchTeams(): Promise<MatchResult> {
  const result: MatchResult = { teamsFormed: 0, teamsSkipped: 0, errors: [] };

  const { data: apps, error: appsError } = await supabaseAdmin
    .from('team_applications')
    .select('id, user_id, level, users(discord_id, nombres)')
    .eq('status', 'pending');

  if (appsError) {
    result.errors.push(`Error al obtener aplicaciones: ${appsError.message}`);
    return result;
  }

  const eligible = ((apps ?? []) as unknown as EligibleApp[]).filter(
    (app) => app.users?.discord_id,
  );

  if (eligible.length === 0) return result;

  const byLevel: Record<string, EligibleApp[]> = {};
  for (const app of eligible) {
    if (!byLevel[app.level]) byLevel[app.level] = [];
    byLevel[app.level].push(app);
  }

  let nextNum = await getNextTeamNumber();

  for (const [level, levelApps] of Object.entries(byLevel)) {
    const groups = splitIntoGroups(levelApps);

    if (groups.length === 0) {
      result.teamsSkipped += levelApps.length;
      continue;
    }

    const project = await getProjectForLevel(level);
    if (!project) {
      result.errors.push(`Sin proyecto disponible para nivel ${level} — ${groups.reduce((s, g) => s + g.length, 0)} usuarios dejados en pending`);
      result.teamsSkipped += groups.reduce((s, g) => s + g.length, 0);
      continue;
    }

    for (const group of groups) {
      const teamName = `Team-${String(nextNum).padStart(3, '0')}`;
      nextNum++;

      try {
        const { data: team, error: teamError } = await supabaseAdmin
          .from('teams')
          .insert({ name: teamName, level, status: 'active', project_id: project.id })
          .select('id')
          .single();

        if (teamError || !team) {
          result.errors.push(`Error al crear equipo ${teamName}: ${teamError?.message}`);
          continue;
        }

        const { error: membersError } = await supabaseAdmin
          .from('team_members')
          .insert(group.map((app) => ({ team_id: team.id, user_id: app.user_id, role: 'member' })));

        if (membersError) {
          result.errors.push(`Error al insertar miembros en ${teamName}: ${membersError.message}`);
          await supabaseAdmin.from('teams').delete().eq('id', team.id);
          continue;
        }

        const { error: assignError } = await supabaseAdmin
          .from('team_applications')
          .update({ status: 'assigned' })
          .in('id', group.map((app) => app.id));

        if (assignError) {
          result.errors.push(
            `Error al actualizar applications en ${teamName}: ${assignError.message}`,
          );
          console.error(`[matching] Failed to mark applications as assigned for ${teamName}:`, assignError);
          // Compensate: remove team_members then the team so no orphan rows remain.
          // team_members FK to teams has no guaranteed CASCADE, so delete members first.
          const { error: rollbackMembersErr } = await supabaseAdmin
            .from('team_members')
            .delete()
            .eq('team_id', team.id);
          if (rollbackMembersErr) {
            console.error(`[matching] Compensation failed (team_members) for ${teamName}:`, rollbackMembersErr);
            result.errors.push(
              `⚠ team_members huérfanos en ${teamName} — limpiar manualmente (team_id: ${team.id})`,
            );
          }
          await supabaseAdmin.from('teams').delete().eq('id', team.id);
          continue;
        }

        result.teamsFormed++;

        const discordIds = group.map((app) => app.users!.discord_id);
        await createDiscordTeamSpace(teamName, discordIds, level, project);
        await sendDiscordMessage(`👥 Nuevo equipo formado automáticamente: ${teamName} 🚀`);
      } catch (err) {
        result.errors.push(`Error inesperado en ${teamName}: ${String(err)}`);
      }
    }
  }

  return result;
}

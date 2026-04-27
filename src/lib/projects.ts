import { supabaseAdmin } from '@/lib/supabase';

export type Project = {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  repo_url: string | null;
  figma_url: string | null;
  team_scope: {
    frontend: string;
    backend: string;
    extra: string;
    stack: string;
  };
};

export async function getProjectForLevel(level: string): Promise<Project | null> {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('id, name, description, difficulty, repo_url, figma_url, team_scope')
    .eq('difficulty', level);

  if (error || !data || data.length === 0) return null;

  const idx = Math.floor(Math.random() * data.length);
  return data[idx] as Project;
}

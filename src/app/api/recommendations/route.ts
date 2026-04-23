import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/subscription';

const NIVEL_ORDER = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];

export interface Recommendation {
  lesson_id: string;
  lesson_title: string;
  module_title: string;
  path_name: string;
  path_id: string;
  reason: string;
  priority: number;
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!email) return NextResponse.json({ recommendations: [] });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ recommendations: [] });

  const [userResult, progressResult, pathsResult] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('current_level, evaluations(debilidades, created_at)')
      .eq('id', user.id)
      .order('created_at', { referencedTable: 'evaluations', ascending: false })
      .limit(1, { referencedTable: 'evaluations' })
      .single(),
    supabaseAdmin
      .from('user_progress')
      .select('lesson_id, progress_percentage, completed')
      .eq('user_id', user.id),
    supabaseAdmin
      .from('learning_paths')
      .select('id, name, level, modules(id, title, lessons(id, title, order_index, module_id))')
      .order('order_index'),
  ]);

  const currentLevel = userResult.data?.current_level as string | null;
  const debilidades: string[] = userResult.data?.evaluations?.[0]?.debilidades ?? [];
  const progressMap: Record<string, { pct: number; completed: boolean }> = {};
  for (const p of progressResult.data ?? []) {
    progressMap[p.lesson_id] = { pct: p.progress_percentage, completed: p.completed };
  }

  const recommendations: Recommendation[] = [];

  for (const path of pathsResult.data ?? []) {
    const pathLevel = path.level as string;
    const currentLevelIdx = currentLevel ? NIVEL_ORDER.indexOf(currentLevel) : 0;
    const pathLevelIdx = NIVEL_ORDER.indexOf(pathLevel);

    if (pathLevelIdx > currentLevelIdx + 1) continue;

    for (const mod of (path.modules as { id: string; title: string; lessons: { id: string; title: string; order_index: number }[] }[]) ?? []) {
      for (const lesson of mod.lessons ?? []) {
        const prog = progressMap[lesson.id];
        if (prog?.completed) continue;

        let priority = 0;
        let reason = '';

        if (prog && prog.pct > 0 && !prog.completed) {
          priority = 100;
          reason = `Continúa donde lo dejaste (${prog.pct}% completado)`;
        } else if (pathLevel === currentLevel) {
          priority = 80;
          reason = `Ruta de tu nivel actual (${pathLevel})`;
        } else if (pathLevelIdx === currentLevelIdx - 1) {
          reason = 'Refuerza conceptos del nivel anterior';
          priority = 50;
        } else if (pathLevelIdx === currentLevelIdx + 1) {
          reason = 'Prepárate para el siguiente nivel';
          priority = 60;
        } else {
          reason = 'Ruta recomendada para ti';
          priority = 30;
        }

        if (debilidades.length > 0) {
          const titleLower = lesson.title.toLowerCase();
          const matches = debilidades.some((d: string) =>
            titleLower.includes(d.toLowerCase()) || d.toLowerCase().includes(titleLower),
          );
          if (matches) {
            priority += 20;
            reason = `Refuerza una debilidad detectada en tu evaluación`;
          }
        }

        recommendations.push({
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          module_title: mod.title,
          path_name: path.name,
          path_id: path.id,
          reason,
          priority,
        });
      }
    }
  }

  recommendations.sort((a, b) => b.priority - a.priority);

  return NextResponse.json({ recommendations: recommendations.slice(0, 5) });
}

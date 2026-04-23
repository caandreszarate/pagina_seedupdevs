import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const lessonIds = req.nextUrl.searchParams.getAll('lesson_ids');

  if (!email) return NextResponse.json({ progress: {} });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ progress: {} });

  let query = supabaseAdmin
    .from('user_progress')
    .select('lesson_id, progress_percentage')
    .eq('user_id', user.id);

  if (lessonIds.length > 0) query = query.in('lesson_id', lessonIds);

  const { data } = await query;

  const progress: Record<string, number> = {};
  for (const row of data ?? []) {
    progress[row.lesson_id] = row.progress_percentage;
  }

  return NextResponse.json({ progress });
}

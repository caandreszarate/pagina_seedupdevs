import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// TODO (Security): This endpoint accepts an email query param with no server-side auth.
// Any caller can look up any user's team status by guessing an email address.
// Sprint 1.5 mitigation: removed non-essential fields (created_at) to reduce exposure.
// Real fix: replace email-based lookup with a verified session token (Supabase Auth or signed JWT).
// Until then, treat the data returned here as semi-public. Do not add sensitive fields.

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ application: null, team: null });
  }

  const [appRes, memberRes] = await Promise.all([
    supabaseAdmin
      .from('team_applications')
      .select('stack, availability, level, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('team_members')
      .select('role, joined_at, teams(id, name, level)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const membership = memberRes.data;
  type TeamRow = { id: string; name: string; level: string };
  const teamRow = membership
    ? ((membership.teams as unknown) as TeamRow | null)
    : null;
  const team = teamRow
    ? { id: teamRow.id, name: teamRow.name, level: teamRow.level, role: membership!.role, joined_at: membership!.joined_at }
    : null;

  return NextResponse.json({ application: appRes.data ?? null, team });
}

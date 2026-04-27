import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest, unauthorizedCronResponse } from '@/lib/cron-auth';
import { runWeeklyReset } from '@/lib/community-actions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!validateCronRequest(req)) return unauthorizedCronResponse(req);
  try {
    const result = await runWeeklyReset();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest, unauthorizedCronResponse } from '@/lib/cron-auth';
import { runDailyWins } from '@/lib/community-actions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!validateCronRequest(req)) return unauthorizedCronResponse(req);
  const result = await runDailyWins();
  return NextResponse.json(result);
}

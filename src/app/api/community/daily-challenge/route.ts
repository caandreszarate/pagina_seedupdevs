import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest, unauthorizedCronResponse } from '@/lib/cron-auth';
import { runDailyChallenge } from '@/lib/community-actions';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!validateCronRequest(req)) return unauthorizedCronResponse(req);
  const result = await runDailyChallenge();
  return NextResponse.json(result);
}

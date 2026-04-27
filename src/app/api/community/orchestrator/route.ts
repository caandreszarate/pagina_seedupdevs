import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest, unauthorizedCronResponse } from '@/lib/cron-auth';
import { runCommunityOrchestrator } from '@/lib/community-orchestrator';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!validateCronRequest(req)) return unauthorizedCronResponse(req);
  try {
    const result = await runCommunityOrchestrator();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

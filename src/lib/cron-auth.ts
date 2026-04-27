import { NextRequest, NextResponse } from 'next/server';

export function validateCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization')?.trim();
  return auth === `Bearer ${secret}`;
}

export function unauthorizedCronResponse(req: NextRequest): NextResponse {
  const auth = req.headers.get('authorization')?.trim();
  return NextResponse.json(
    {
      error: 'Unauthorized',
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasAuthorizationHeader: Boolean(auth),
      expectedFormat: 'Authorization: Bearer <CRON_SECRET>',
    },
    { status: 401 },
  );
}

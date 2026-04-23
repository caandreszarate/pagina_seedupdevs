import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const adminId = await verifyAdminByEmail(email);
  if (!adminId) return NextResponse.json({ is_admin: false }, { status: 403 });
  return NextResponse.json({ is_admin: true });
}

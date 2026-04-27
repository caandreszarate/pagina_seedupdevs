import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';
import { runScanOpportunities } from '@/lib/community-actions';
import type { OpportunityType } from '@/types/community';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    admin_email: string;
    mode?: string;
    user_id?: string;
    opportunity_type?: OpportunityType;
    notes?: string;
  };

  const isAdmin = await verifyAdminByEmail(body.admin_email);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Manual mode
  if (body.mode !== 'auto') {
    if (!body.user_id || !body.opportunity_type) {
      return NextResponse.json(
        { error: 'user_id y opportunity_type requeridos en modo manual' },
        { status: 400 },
      );
    }
    const { error } = await supabaseAdmin.from('opportunity_matches').insert({
      user_id: body.user_id,
      opportunity_type: body.opportunity_type,
      notes: body.notes ?? null,
      status: 'open',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Auto scan mode
  try {
    const result = await runScanOpportunities();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!.trim(),
    redirect_uri: process.env.DISCORD_REDIRECT_URI!.trim(),
    response_type: 'code',
    scope: 'identify guilds.join',
    state: Buffer.from(email).toString('base64'),
  });

  return NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`,
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { logDiscordActivity } from '@/lib/discord';
import type { EventType, ActivityMetadata } from '@/types/community';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-bot-secret');
  if (!secret || secret !== process.env.DISCORD_BOT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    discord_id: string;
    event_type: EventType;
    channel_name?: string;
    metadata?: ActivityMetadata;
  };

  if (!body.discord_id || !body.event_type) {
    return NextResponse.json({ error: 'discord_id y event_type requeridos' }, { status: 400 });
  }

  await logDiscordActivity({
    discordId: body.discord_id,
    eventType: body.event_type,
    channelName: body.channel_name,
    metadata: body.metadata,
  });

  return NextResponse.json({ ok: true });
}

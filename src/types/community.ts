export type EventType =
  | 'message'
  | 'reaction'
  | 'join_voice'
  | 'challenge_submit'
  | 'mention'
  | 'inactivity_nudge_sent'
  | 'member_join'
  | 'retention_nudge_sent';

export type ActivityMetadata = {
  content?: string;
  attachments?: string[];
  mentioned_users?: string[];
  extra?: Record<string, unknown>;
};

export type DiscordActivityLog = {
  id: string;
  user_id: string | null;
  discord_id: string;
  event_type: EventType;
  channel_name: string | null;
  metadata: ActivityMetadata | null;
  created_at: string;
};

export type CommunityEngagementScore = {
  id: string;
  user_id: string;
  weekly_messages: number;
  weekly_reactions: number;
  weekly_challenges: number;
  weekly_voice: number;
  weekly_mentions: number;
  engagement_score: number;
  engagement_tier: string;
  last_calculated_at: string;
};

export type MentorSession = {
  id: string;
  mentor_user_id: string;
  mentee_user_id: string;
  status: 'pending' | 'active' | 'closed';
  created_at: string;
};

export type OpportunityType = 'freelance' | 'founder' | 'mentor' | 'collaborator';

export type OpportunityMatch = {
  id: string;
  user_id: string;
  opportunity_type: OpportunityType;
  notes: string | null;
  status: 'open' | 'matched' | 'closed';
  created_at: string;
};

export type AutomationEvent = {
  id: string;
  event_name: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};


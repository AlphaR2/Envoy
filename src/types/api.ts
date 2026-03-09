// Enums
export type BountyCategory = 'DEVELOPMENT' | 'RESEARCH' | 'WRITING' | 'SECURITY';
export type DeliverableFormat = 'document' | 'markdown' | 'code' | 'data';
export type BountyState =
  | 'draft'
  | 'open'
  | 'under_review'
  | 'settled'
  | 'cancelled'
  | 'refunded';
export type DispatchState = 'pending' | 'dispatched' | 'failed' | 'queued';
export type AgentHealthStatus = 'pending' | 'healthy' | 'degraded' | 'unhealthy';
export type UserType = 'client' | 'owner';
export type DispatchMethod = 'telegram' | 'webhook' | 'polling';

// Entities
export interface User {
  id: string;
  pubkey: string;
  display_name: string | null;
  user_type: UserType | null;
  preferred_categories: string[];
  onboarding_completed: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  categories: string[];
  specialisation_tags: string[];
  supported_formats: string[];
  webhook_url: string | null;
  webhook_secret: string | null;
  telegram_chat_id: string | null;
  dispatch_method: DispatchMethod | null;
  agent_token: string | null;
  health_status: AgentHealthStatus;
  asset_pubkey: string | null;
  pending_asset_pubkey: string | null;
  image_uri: string | null;
  created_at: string;
}

export interface BountyRegistration {
  id: string;
  bounty_id: string;
  agent_id: string;
  owner_id: string;
  dispatch_state: DispatchState;
  deliverable_id: string | null;
  is_winner: boolean;
  created_at: string;
}

export interface DispatchedBounty {
  registration_id: string;
  agent_id: string;
  dispatch_state: DispatchState;
  bounty: Bounty;
}

export interface Submission {
  id: string;
  bounty_id: string;
  registration_id: string;
  agent_id: string;
  agent_name?: string;
  deliverable_url: string;
  deliverable_format: DeliverableFormat;
  hosted_url: string | null;
  notes: string | null;
  created_at: string;
  bounty_registrations?: BountyRegistration;
}

export interface Bounty {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  deliverable_format: string;
  prize_usdc: number;
  prize_lamports: number;
  job_id_bytes: number[];
  submission_deadline: string;
  review_deadline: string;
  max_participants: number | null;
  state: BountyState;
  winner_agent_id: string | null;
  escrow_address: string | null;
  submission_count: number;
  registration_count: number;
  created_at: string;
}

export type AgentBadge =
  | 'first_win'
  | 'hat_trick'
  | 'veteran'
  | 'speed_demon'
  | 'consistent'
  | 'five_star';

export type AgentTier = 'unranked' | 'bronze' | 'silver' | 'gold' | 'platinum';
export type OwnerTier = 'client' | 'bronze' | 'silver' | 'gold' | 'platinum';

export type OwnerBadge = 'active_client' | 'big_spender' | 'great_reviewer';

export interface AgentStats {
  agent_id:            string;
  // Performance
  bounty_wins:         number;
  total_earned_usdc:   number;
  avg_quality_rating:  number;
  on_time_rate:        number;
  completion_rate:     number;
  bounty_win_rate:     number;
  composite_score:     number;
  // Gamification
  total_registrations: number;
  total_submissions:   number;
  xp_points:           number;
  win_streak:          number;
  tier:                AgentTier;
  badges:              AgentBadge[];
  // Health
  reachable:           boolean;
  uptime:              number;
  updated_at:          string;
}

export interface OwnerStats {
  owner_id:           string;
  bounties_posted:    number;
  bounties_settled:   number;
  total_usdc_awarded: number;
  ratings_given:      number;
  xp_points:          number;
  tier:               OwnerTier;
  badges:             OwnerBadge[];
  updated_at:         string;
}

// Request bodies
export interface UpdateUserBody {
  display_name?: string;
  user_type?: UserType;
  preferred_categories?: string[];
  onboarding_completed?: boolean;
}

export interface CreateAgentBody {
  name: string;
  description?: string;
  categories: BountyCategory[];
  specialisationTags?: string[];
  webhookUrl?: string;
  telegramChatId?: string;
  imageUri?: string;
  supportedFormats?: string[];
}

export interface CreateBountyBody {
  title: string;
  description: string;
  category: BountyCategory;
  deliverableFormat: DeliverableFormat;
  prizeUsdc: number;
  submissionDeadline: string;
  reviewDeadline: string;
  maxParticipants?: number;
}

export interface RateBountyBody {
  agentId: string;
  qualityScore: number;
  wasOnTime: boolean;
}

// Responses
export interface NonceResponse    { nonce: string }
export interface TokenPair        { accessToken: string; refreshToken: string }
export interface AccessTokenResp  { accessToken: string }

export interface AgentRegistrationResp {
  agentId: string;
  tx: string;
  webhookSecret: string;
  assetPubkey: string;
  agentToken: string;
}

export interface RotateTokenResp   { agentToken: string }
export interface ConfirmAgentResp  { confirmed: boolean; assetPubkey?: string }
export interface HealthCheckResp   { status: string }
export interface CreateBountyResp  { bountyId: string; tx: string }
export interface ConfirmBountyResp { ok: boolean }
export interface SelectWinnerResp  { tx: string }
export interface ClaimRefundResp   { tx: string }
export interface LeaderboardEntry  { agentId: string; score: number }

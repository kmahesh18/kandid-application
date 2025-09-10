import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { 
  users, 
  campaigns, 
  leads, 
  accountInteractions, 
  sessions, 
  accounts 
} from '@/db/schema';

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Campaign types
export type Campaign = InferSelectModel<typeof campaigns>;
export type NewCampaign = InferInsertModel<typeof campaigns>;

// Lead types
export type Lead = InferSelectModel<typeof leads>;
export type NewLead = InferInsertModel<typeof leads>;

// Lead interaction types
export type AccountInteraction = InferSelectModel<typeof accountInteractions>;
export type NewAccountInteraction = InferInsertModel<typeof accountInteractions>;

// Session types
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

// Account types
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

// Extended types with relations
export type CampaignWithLeads = Campaign & {
  leads: Lead[];
};

export type LeadWithCampaign = Lead & {
  campaign: Campaign;
};

export type LeadWithCampaignName = Lead & {
  campaignName: string | null;
};

export type LeadWithInteractions = Lead & {
  interactions: AccountInteraction[];
};

export type LeadWithCampaignAndInteractions = Lead & {
  campaign: Campaign;
  interactions: AccountInteraction[];
};

// Campaign status type
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

// Lead status type
export type LeadStatus = 'pending' | 'contacted' | 'responded' | 'converted';

// Interaction type
export type InteractionType = 'email' | 'call' | 'meeting' | 'note';

// API response types
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Filter types
export type CampaignFilters = {
  status?: CampaignStatus[];
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

export type LeadFilters = {
  status?: LeadStatus[];
  campaignId?: string;
  search?: string;
  sortBy?: 'name' | 'email' | 'company' | 'createdAt' | 'lastContactedAt';
  sortOrder?: 'asc' | 'desc';
};

// Dashboard statistics types
export type CampaignStats = {
  id: string;
  name: string;
  status: CampaignStatus;
  totalLeads: number;
  successfulLeads: number;
  responseRate: number;
  createdAt: Date;
};

export type DashboardMetrics = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  convertedLeads: number;
  overallResponseRate: number;
  recentCampaigns: CampaignStats[];
};

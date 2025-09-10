import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types for dashboard analytics
export interface DashboardAnalytics {
  overview: {
    totalCampaigns: number;
    totalLeads: number;
    activeCampaigns: number;
    convertedLeads: number;
    conversionRate: number;
    avgLeadScore: number;
  };
  recentActivity: {
    newLeadsThisWeek: number;
    newCampaignsThisWeek: number;
  };
  distributions: {
    leadStatus: Array<{ status: string; count: number }>;
    campaignStatus: Array<{ status: string; count: number }>;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
  }>;
  recentInteractions: Array<{
    id: string;
    type: string;
    content: string | null;
    timestamp: string;
    leadId: string;
    leadName: string;
    leadEmail: string;
  }>;
  dailyLeads: Array<{
    date: string;
    leads: number;
  }>;
}

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
};

// Get dashboard analytics
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => api.get<DashboardAnalytics>('/analytics/dashboard'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

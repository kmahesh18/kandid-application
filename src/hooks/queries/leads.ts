import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { 
  Lead, 
  NewLead, 
  LeadWithCampaign,
  LeadWithCampaignName,
  LeadWithCampaignAndInteractions,
  AccountInteraction,
  NewAccountInteraction,
  PaginatedResponse,
  LeadFilters 
} from '@/types/database';
import { toast } from 'sonner';

// Query Keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: LeadFilters) => [...leadKeys.lists(), filters] as const,
  infinite: (filters: LeadFilters) => [...leadKeys.lists(), 'infinite', filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  interactions: (leadId: string) => [...leadKeys.all, 'interactions', leadId] as const,
};

// Get leads with infinite scroll
export function useInfiniteLeads(filters: LeadFilters, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: leadKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      api.get<PaginatedResponse<LeadWithCampaignName>>('/leads', {
        headers: {
          'X-Filters': JSON.stringify(filters),
          'X-Page': pageParam.toString(),
          'X-Page-Size': pageSize.toString(),
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get leads with regular pagination
export function useLeads(filters: LeadFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...leadKeys.list(filters), page, pageSize],
    queryFn: () => 
      api.get<PaginatedResponse<LeadWithCampaignName>>('/leads', {
        headers: {
          'X-Filters': JSON.stringify(filters),
          'X-Page': page.toString(),
          'X-Page-Size': pageSize.toString(),
        },
      }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single lead with campaign and interactions
export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => api.get<LeadWithCampaignAndInteractions>(`/leads/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get lead interactions
export function useLeadInteractions(leadId: string) {
  return useQuery({
    queryKey: leadKeys.interactions(leadId),
    queryFn: () => api.get<AccountInteraction[]>(`/leads/${leadId}/interactions`),
    enabled: !!leadId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create lead mutation
// Frontend form data for creating leads (backend adds userId)
type CreateLeadRequest = {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  notes?: string;
  tags?: string;
  status?: 'pending' | 'contacted' | 'responded' | 'converted';
  campaignId?: string;
};

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadRequest) => api.post<Lead>('/leads', data),
    onSuccess: (newLead) => {
      // Invalidate leads lists and infinite queries
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      
      // Also invalidate campaign details if campaign is specified
      if (newLead.campaignId) {
        queryClient.invalidateQueries({ 
          queryKey: ['campaigns', 'detail', newLead.campaignId] 
        });
      }
      
      toast.success('Lead created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create lead');
    },
  });
}

// Update lead mutation
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      api.put<Lead>(`/leads/${id}`, data),
    onSuccess: (updatedLead) => {
      // Update specific lead in cache
      queryClient.setQueryData(
        leadKeys.detail(updatedLead.id),
        updatedLead
      );
      
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      
      // Invalidate campaign details if campaign changed
      if (updatedLead.campaignId) {
        queryClient.invalidateQueries({ 
          queryKey: ['campaigns', 'detail', updatedLead.campaignId] 
        });
      }
      
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
}

// Delete lead mutation
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: leadKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      
      toast.success('Lead deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete lead');
    },
  });
}

// Add interaction to lead
export function useAddLeadInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: NewAccountInteraction }) =>
      api.post<AccountInteraction>(`/leads/${leadId}/interactions`, data),
    onSuccess: (newInteraction, { leadId }) => {
      // Invalidate interactions for this lead
      queryClient.invalidateQueries({ 
        queryKey: leadKeys.interactions(leadId) 
      });
      
      // Invalidate lead detail to refresh
      queryClient.invalidateQueries({ 
        queryKey: leadKeys.detail(leadId) 
      });
      
      toast.success('Interaction added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add interaction');
    },
  });
}

// Bulk operations
export function useBulkUpdateLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<Lead> }) =>
      api.patch<{ count: number }>('/leads', { ids, data }),
    onSuccess: (result) => {
      // Invalidate all lead queries
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      
      toast.success(`${result.count} leads updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update leads');
    },
  });
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      api.delete<{ count: number }>('/leads', {
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (result) => {
      // Invalidate all lead queries
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      
      toast.success(`${result.count} leads deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete leads');
    },
  });
}

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { 
  Campaign, 
  NewCampaign, 
  CampaignWithLeads, 
  CampaignStats,
  PaginatedResponse,
  CampaignFilters 
} from '@/types/database';
import { toast } from 'sonner';

// Query Keys
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters, page?: number, pageSize?: number) => 
    [...campaignKeys.lists(), { filters, page, pageSize }] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  stats: () => [...campaignKeys.all, 'stats'] as const,
};

// Get campaigns with pagination and filtering
export function useCampaigns(filters: CampaignFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: campaignKeys.list(filters, page, pageSize),
    queryFn: () => 
      api.get<PaginatedResponse<Campaign>>('/campaigns', {
        headers: {
          'X-Filters': JSON.stringify(filters),
          'X-Page': page.toString(),
          'X-Page-Size': pageSize.toString(),
        },
      }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get campaigns with infinite scroll
export function useInfiniteCampaigns(filters: {
  search?: string;
  status?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}) {
  return useInfiniteQuery({
    queryKey: ['campaigns', 'infinite', filters],
    queryFn: ({ pageParam }: { pageParam: number }) => 
      api.get<PaginatedResponse<Campaign>>('/campaigns', {
        headers: {
          'X-Filters': JSON.stringify(filters),
          'X-Page': pageParam.toString(),
          'X-Page-Size': '20',
        },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Campaign>) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get single campaign with leads
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => api.get<CampaignWithLeads>(`/campaigns/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get campaign statistics
export function useCampaignStats() {
  return useQuery({
    queryKey: campaignKeys.stats(),
    queryFn: () => api.get<CampaignStats[]>('/campaigns/stats'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create campaign mutation
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; status?: 'draft' | 'active' | 'paused' | 'completed' }) => 
      api.post<Campaign>('/campaigns', data),
    onSuccess: (newCampaign) => {
      // Invalidate campaigns list
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() });
      
      toast.success('Campaign created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });
}

// Update campaign mutation
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      api.put<Campaign>(`/campaigns/${id}`, data),
    onSuccess: (updatedCampaign) => {
      // Update specific campaign in cache
      queryClient.setQueryData(
        campaignKeys.detail(updatedCampaign.id),
        updatedCampaign
      );
      
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() });
      
      toast.success('Campaign updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaign');
    },
  });
}

// Delete campaign mutation
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: campaignKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.stats() });
      
      toast.success('Campaign deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });
}

// Bulk operations
export function useBulkUpdateCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<Campaign> }) =>
      api.patch<{ count: number }>('/campaigns', { ids, data }),
    onSuccess: (result) => {
      // Invalidate all campaign queries
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      
      toast.success(`${result.count} campaigns updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update campaigns');
    },
  });
}

export function useBulkDeleteCampaigns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      api.delete<{ count: number }>('/campaigns', {
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (result) => {
      // Invalidate all campaign queries
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      
      toast.success(`${result.count} campaigns deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete campaigns');
    },
  });
}

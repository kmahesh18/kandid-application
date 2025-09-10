import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PaginationState {
  // Campaign pagination
  campaignPage: number;
  campaignPageSize: number;
  campaignTotal: number;
  campaignHasMore: boolean;
  setCampaignPagination: (page: number, total: number, hasMore: boolean) => void;
  resetCampaignPagination: () => void;
  
  // Lead pagination (for infinite scroll)
  leadPage: number;
  leadPageSize: number;
  leadTotal: number;
  leadHasMore: boolean;
  leadLoadedIds: Set<string>;
  setLeadPagination: (page: number, total: number, hasMore: boolean) => void;
  addLoadedLeadIds: (ids: string[]) => void;
  resetLeadPagination: () => void;
  
  // Loading states for pagination
  isCampaignLoading: boolean;
  setIsCampaignLoading: (loading: boolean) => void;
  
  isLeadLoading: boolean;
  setIsLeadLoading: (loading: boolean) => void;
  
  isLoadingMore: boolean;
  setIsLoadingMore: (loading: boolean) => void;
}

export const usePaginationStore = create<PaginationState>()(
  devtools(
    (set) => ({
      // Campaign pagination
      campaignPage: 1,
      campaignPageSize: 20,
      campaignTotal: 0,
      campaignHasMore: true,
      setCampaignPagination: (page, total, hasMore) =>
        set({ 
          campaignPage: page, 
          campaignTotal: total, 
          campaignHasMore: hasMore 
        }),
      resetCampaignPagination: () =>
        set({
          campaignPage: 1,
          campaignTotal: 0,
          campaignHasMore: true,
        }),
      
      // Lead pagination (for infinite scroll)
      leadPage: 1,
      leadPageSize: 50,
      leadTotal: 0,
      leadHasMore: true,
      leadLoadedIds: new Set(),
      setLeadPagination: (page, total, hasMore) =>
        set({ 
          leadPage: page, 
          leadTotal: total, 
          leadHasMore: hasMore 
        }),
      addLoadedLeadIds: (ids) =>
        set((state) => ({
          leadLoadedIds: new Set([...state.leadLoadedIds, ...ids]),
        })),
      resetLeadPagination: () =>
        set({
          leadPage: 1,
          leadTotal: 0,
          leadHasMore: true,
          leadLoadedIds: new Set(),
        }),
      
      // Loading states for pagination
      isCampaignLoading: false,
      setIsCampaignLoading: (loading) => set({ isCampaignLoading: loading }),
      
      isLeadLoading: false,
      setIsLeadLoading: (loading) => set({ isLeadLoading: loading }),
      
      isLoadingMore: false,
      setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),
    }),
    {
      name: 'pagination-store',
    }
  )
);

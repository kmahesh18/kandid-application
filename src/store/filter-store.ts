import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CampaignStatus, LeadStatus, CampaignFilters, LeadFilters } from '@/types/database';

interface FilterState {
  // Campaign filters
  campaignFilters: CampaignFilters;
  setCampaignFilters: (filters: Partial<CampaignFilters>) => void;
  resetCampaignFilters: () => void;
  
  // Lead filters
  leadFilters: LeadFilters;
  setLeadFilters: (filters: Partial<LeadFilters>) => void;
  resetLeadFilters: () => void;
  
  // Search states
  campaignSearch: string;
  setCampaignSearch: (search: string) => void;
  
  leadSearch: string;
  setLeadSearch: (search: string) => void;
  
  // Selected items for bulk operations
  selectedCampaigns: string[];
  setSelectedCampaigns: (ids: string[]) => void;
  toggleCampaignSelection: (id: string) => void;
  clearCampaignSelection: () => void;
  
  selectedLeads: string[];
  setSelectedLeads: (ids: string[]) => void;
  toggleLeadSelection: (id: string) => void;
  clearLeadSelection: () => void;
}

const defaultCampaignFilters: CampaignFilters = {
  status: undefined,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultLeadFilters: LeadFilters = {
  status: undefined,
  campaignId: undefined,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterState>()(
  devtools(
    (set, get) => ({
      // Campaign filters
      campaignFilters: defaultCampaignFilters,
      setCampaignFilters: (filters) =>
        set((state) => ({
          campaignFilters: { ...state.campaignFilters, ...filters },
        })),
      resetCampaignFilters: () => set({ campaignFilters: defaultCampaignFilters }),
      
      // Lead filters
      leadFilters: defaultLeadFilters,
      setLeadFilters: (filters) =>
        set((state) => ({
          leadFilters: { ...state.leadFilters, ...filters },
        })),
      resetLeadFilters: () => set({ leadFilters: defaultLeadFilters }),
      
      // Search states
      campaignSearch: '',
      setCampaignSearch: (search) => {
        set({ campaignSearch: search });
        // Also update the filters
        get().setCampaignFilters({ search });
      },
      
      leadSearch: '',
      setLeadSearch: (search) => {
        set({ leadSearch: search });
        // Also update the filters
        get().setLeadFilters({ search });
      },
      
      // Selected items for bulk operations
      selectedCampaigns: [],
      setSelectedCampaigns: (ids) => set({ selectedCampaigns: ids }),
      toggleCampaignSelection: (id) =>
        set((state) => ({
          selectedCampaigns: state.selectedCampaigns.includes(id)
            ? state.selectedCampaigns.filter((campaignId) => campaignId !== id)
            : [...state.selectedCampaigns, id],
        })),
      clearCampaignSelection: () => set({ selectedCampaigns: [] }),
      
      selectedLeads: [],
      setSelectedLeads: (ids) => set({ selectedLeads: ids }),
      toggleLeadSelection: (id) =>
        set((state) => ({
          selectedLeads: state.selectedLeads.includes(id)
            ? state.selectedLeads.filter((leadId) => leadId !== id)
            : [...state.selectedLeads, id],
        })),
      clearLeadSelection: () => set({ selectedLeads: [] }),
    }),
    {
      name: 'filter-store',
    }
  )
);

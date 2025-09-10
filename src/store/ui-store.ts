import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal/Dialog states
  isLeadDetailOpen: boolean;
  selectedLeadId: string | null;
  setLeadDetailOpen: (open: boolean, leadId?: string) => void;
  
  // Sheet states  
  isCreateCampaignOpen: boolean;
  setCreateCampaignOpen: (open: boolean) => void;
  
  isCreateLeadOpen: boolean;
  setCreateLeadOpen: (open: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Modal/Dialog states
      isLeadDetailOpen: false,
      selectedLeadId: null,
      setLeadDetailOpen: (open, leadId = undefined) => 
        set({ isLeadDetailOpen: open, selectedLeadId: leadId || null }),
      
      // Sheet states
      isCreateCampaignOpen: false,
      setCreateCampaignOpen: (open) => set({ isCreateCampaignOpen: open }),
      
      isCreateLeadOpen: false,
      setCreateLeadOpen: (open) => set({ isCreateLeadOpen: open }),
      
      // Loading states
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-store',
    }
  )
);

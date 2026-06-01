import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  sidebarSearchQuery: string;
  sidebarTopicFilter: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setTopicFilter: (topic: string | null) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarSearchQuery: '',
  sidebarTopicFilter: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setSearchQuery: (query: string) => set({ sidebarSearchQuery: query }),
  setTopicFilter: (topic: string | null) => set({ sidebarTopicFilter: topic }),
  clearFilters: () => set({ sidebarSearchQuery: '', sidebarTopicFilter: null }),
}));

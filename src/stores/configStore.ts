import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiVersionType } from '../types/api';

interface ConfigState {
  tenantId: string;
  userId: string;
  workspaceId: string;
  apiVersion: ApiVersionType;
  theme: 'light' | 'dark';
  setTenantId: (id: string) => void;
  setUserId: (id: string) => void;
  setWorkspaceId: (id: string) => void;
  setApiVersion: (v: ApiVersionType) => void;
  toggleTheme: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      tenantId: import.meta.env.VITE_DEFAULT_TENANT_ID || 'afedf-1234-2redf',
      userId: import.meta.env.VITE_DEFAULT_USER_ID || '1234-54gtf-dx-2-fss',
      workspaceId: import.meta.env.VITE_DEFAULT_WORKSPACE_ID || 'cxdwe4t534gt-w43t54aw4-34q',
      apiVersion: (import.meta.env.VITE_DEFAULT_API_VERSION as ApiVersionType) || '1.1',
      theme: 'dark',
      setTenantId: (tenantId) => set({ tenantId }),
      setUserId: (userId) => set({ userId }),
      setWorkspaceId: (workspaceId) => set({ workspaceId }),
      setApiVersion: (apiVersion) => set({ apiVersion }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'teamsync-config' }
  )
);

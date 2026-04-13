import { create } from 'zustand';

interface UIState {
  /** "Create New Document" template chooser modal */
  newDocumentOpen: boolean;
  /** Pre-fills the folder field in the New Document modal when opening from inside a folder */
  newDocumentDefaultFolderId: string | null;
  openNewDocument: (defaultFolderId?: string) => void;
  closeNewDocument: () => void;
}

/**
 * Transient (non-persisted) UI state for modals/drawers/etc that
 * should be globally triggerable from anywhere in the app.
 */
export const useUIStore = create<UIState>((set) => ({
  newDocumentOpen: false,
  newDocumentDefaultFolderId: null,
  openNewDocument: (defaultFolderId) =>
    set({ newDocumentOpen: true, newDocumentDefaultFolderId: defaultFolderId || null }),
  closeNewDocument: () => set({ newDocumentOpen: false, newDocumentDefaultFolderId: null }),
}));

import { create } from 'zustand';
import { documentService } from '../api/documentService';
import { presignedUploadService } from '../api/presignedUploadService';
import type { CreateDocumentMetadata, PresignedUploadInitiateRequest } from '../types/api';

export type UploadMethod = 'multipart' | 'stream' | 'presigned';
export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'success' | 'error' | 'cancelled';

export interface UploadItem {
  id: string;
  file: File;
  method: UploadMethod;
  metadata?: CreateDocumentMetadata;
  status: UploadStatus;
  progress: number;          // 0-100
  partInfo?: { current: number; total: number };
  error?: { title: string; detail?: string | null; errorCode?: string | null };
  documentId?: string;       // for presigned, set after initiate (used for resume / abort)
  completedParts?: { partNumber: number; etag: string }[];
  abortController?: AbortController;
  pauseFlag?: { paused: boolean };
  // Conflict resolution chosen mid-flight (REPLACE/KEEP_BOTH/SAVE)
  conflictResolution?: 'SAVE' | 'REPLACE' | 'KEEP_BOTH';
}

interface State {
  items: UploadItem[];
  open: boolean;
  maxConcurrent: number;
  enqueue: (
    files: File[],
    method: UploadMethod,
    metadata?: CreateDocumentMetadata
  ) => void;
  startNext: () => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  remove: (id: string) => void;
  clearFinished: () => void;
  setOpen: (open: boolean) => void;
  setConflictAndRetry: (id: string, choice: 'REPLACE' | 'KEEP_BOTH' | 'SAVE') => void;
}

const updateItem = (set: any, id: string, patch: Partial<UploadItem>) => {
  set((s: State) => ({
    items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
  }));
};

const isConflict = (err: any) => err?.status === 409 || err?.errorCode === 'DOC-409-001';

export const useUploadQueue = create<State>()((set, get) => ({
  items: [],
  open: false,
  maxConcurrent: 3,

  enqueue: (files, method, metadata) => {
    const newItems: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`,
      file,
      method,
      metadata,
      status: 'queued',
      progress: 0,
    }));
    set((s) => ({ items: [...s.items, ...newItems], open: true }));
    get().startNext();
  },

  startNext: () => {
    const { items, maxConcurrent } = get();
    const running = items.filter((i) => i.status === 'uploading').length;
    if (running >= maxConcurrent) return;
    const next = items.find((i) => i.status === 'queued');
    if (!next) return;
    runUpload(next.id, set, get).then(() => get().startNext());
    // Trigger more if room
    if (running + 1 < maxConcurrent) get().startNext();
  },

  pause: (id) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    if (it.method !== 'presigned') return; // pause only for presigned
    if (it.pauseFlag) it.pauseFlag.paused = true;
    updateItem(set, id, { status: 'paused' });
  },

  resume: (id) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    if (it.method !== 'presigned') return;
    if (it.pauseFlag) it.pauseFlag.paused = false;
    updateItem(set, id, { status: 'uploading' });
    // The running loop will pick up the flag change
  },

  cancel: (id) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    it.abortController?.abort();
    if (it.documentId && it.method === 'presigned') {
      presignedUploadService.abort(it.documentId).catch(() => {});
    }
    updateItem(set, id, { status: 'cancelled' });
    get().startNext();
  },

  retry: (id) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    updateItem(set, id, {
      status: 'queued',
      progress: 0,
      error: undefined,
      abortController: undefined,
    });
    get().startNext();
  },

  remove: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  clearFinished: () => {
    set((s) => ({
      items: s.items.filter((i) => !['success', 'error', 'cancelled'].includes(i.status)),
    }));
  },

  setOpen: (open) => set({ open }),

  setConflictAndRetry: (id, choice) => {
    const it = get().items.find((i) => i.id === id);
    if (!it) return;
    const meta = { ...(it.metadata || {}), conflictResolution: choice };
    updateItem(set, id, {
      conflictResolution: choice,
      metadata: meta,
      status: 'queued',
      progress: 0,
      error: undefined,
    });
    get().startNext();
  },
}));

// ──────────────────────────────────────────────────────────────────────
// Worker
// ──────────────────────────────────────────────────────────────────────
async function runUpload(id: string, set: any, get: () => State) {
  const item = get().items.find((i) => i.id === id);
  if (!item) return;

  const ac = new AbortController();
  const pauseFlag = { paused: false };
  updateItem(set, id, { status: 'uploading', abortController: ac, pauseFlag });

  try {
    if (item.method === 'multipart') {
      await documentService.upload(item.file, item.metadata, '1.1');
      updateItem(set, id, { status: 'success', progress: 100 });
    } else if (item.method === 'stream') {
      await documentService.uploadStream(item.file, item.metadata);
      updateItem(set, id, { status: 'success', progress: 100 });
    } else {
      // presigned
      const initReq: PresignedUploadInitiateRequest = {
        documentName: item.metadata?.documentName || item.file.name,
        folderId: item.metadata?.folderId,
        tags: item.metadata?.tags,
        documentType: item.metadata?.documentType,
        conflictResolution: item.metadata?.conflictResolution,
        fileSize: item.file.size,
        contentType: item.file.type || 'application/octet-stream',
      };
      const data = await presignedUploadService.initiate(initReq);
      updateItem(set, id, { documentId: data.document.id });

      // Status check (resume support) - non-fatal
      try { await presignedUploadService.getStatus(data.document.id); } catch { /* ignore */ }

      const completed = await presignedUploadService.uploadChunks(
        item.file,
        data,
        (p) => {
          // Wait while paused
          // (synchronous progress hook — we set status only)
          const pct = Math.round(((p.partNumber - 1) / p.totalParts) * 100 + (p.uploaded / p.total / p.totalParts) * 100);
          updateItem(set, id, {
            progress: Math.min(99, pct),
            partInfo: { current: p.partNumber, total: p.totalParts },
          });
        },
        ac.signal,
      );

      // Pause-aware barrier (after each chunk we check)
      while (pauseFlag.paused) {
        await new Promise((r) => setTimeout(r, 500));
        if (ac.signal.aborted) throw new Error('Upload aborted');
      }

      if (completed.length !== data.totalParts) {
        throw new Error(`Only ${completed.length}/${data.totalParts} parts have etags`);
      }
      updateItem(set, id, { completedParts: completed });

      // Complete with retry
      let attempts = 3;
      while (attempts > 0) {
        try {
          await presignedUploadService.complete({ documentId: data.document.id, parts: completed });
          break;
        } catch (e) {
          attempts--;
          if (attempts === 0) throw e;
          try { await presignedUploadService.getStatus(data.document.id); } catch { /* ignore */ }
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      updateItem(set, id, { status: 'success', progress: 100 });
    }
  } catch (err: any) {
    if (err?.message === 'Upload aborted' || ac.signal.aborted) {
      updateItem(set, id, { status: 'cancelled' });
      return;
    }
    if (isConflict(err)) {
      // Mark as error with conflict flag — UI will prompt
      updateItem(set, id, {
        status: 'error',
        error: {
          title: 'File conflict',
          detail: err.detail || 'A file with this name already exists. Choose how to resolve.',
          errorCode: 'CONFLICT',
        },
      });
      return;
    }
    updateItem(set, id, {
      status: 'error',
      error: {
        title: err?.title || err?.message || 'Upload failed',
        detail: err?.detail || null,
        errorCode: err?.errorCode || null,
      },
    });
  }
}

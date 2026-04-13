import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../api/documentService';
import type { ApiVersionType, CopyRequest, CreateDocumentMetadata, UpdateDocumentRequest } from '../types/api';
import { useConfigStore } from '../stores/configStore';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['documents'] as const,
  list: (folderId?: string, page?: number) => [...KEYS.all, 'list', folderId, page] as const,
  listAll: (page?: number, size?: number) => [...KEYS.all, 'listAll', page, size] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export function useDocumentsList(folderId?: string, page = 0, size = 25, sort?: string) {
  const version = useConfigStore((s) => s.apiVersion);
  return useQuery({
    queryKey: KEYS.list(folderId, page),
    queryFn: () => documentService.list({ folderId, page, size, sort }, version),
  });
}

/**
 * Lists ALL documents (root + nested) across the current tenant + workspace.
 * Uses the v1.0 /api/documents/all endpoint.
 */
export function useAllDocuments(page = 0, size = 25) {
  return useQuery({
    queryKey: KEYS.listAll(page, size),
    queryFn: () => documentService.listAll(page, size),
  });
}

export function useDocumentDetail(id: string) {
  const version = useConfigStore((s) => s.apiVersion);
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => documentService.getById(id, version),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, metadata, version }: {
      file: File;
      metadata?: CreateDocumentMetadata;
      version?: ApiVersionType;
    }) => documentService.upload(file, metadata, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document uploaded');
    },
    onError: (err: any) => toast.error(err.message || 'Upload failed'),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: UpdateDocumentRequest; version?: ApiVersionType }) =>
      documentService.update(id, data, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update document'),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document moved to trash');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete document'),
  });
}

export function useCopyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CopyRequest }) =>
      documentService.copy(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document copied');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to copy document'),
  });
}

export function useUpdateDocumentAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attributes, version }: { id: string; attributes: Record<string, string>; version?: ApiVersionType }) =>
      documentService.updateAttributes(id, attributes, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Attributes updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update attributes'),
  });
}

export function useCreateFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateType, metadata }: { templateType: string; metadata: CreateDocumentMetadata }) =>
      documentService.createFromTemplate(templateType, metadata),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['myDrive'] });
      toast.success('Document created from template');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create document'),
  });
}

export function useBatchUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ files, parentId, conflictResolution }: {
      files: File[];
      parentId?: string;
      conflictResolution?: string;
    }) => documentService.batchUpload(files, parentId, conflictResolution),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success(`Batch upload: ${data.data.successCount} succeeded, ${data.data.failCount} failed`);
    },
    onError: (err: any) => toast.error(err.message || 'Batch upload failed'),
  });
}

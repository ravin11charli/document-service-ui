import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentTypeService } from '../api/documentTypeService';
import type { DocumentTypeRequest } from '../types/api';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['documentTypes'] as const,
  list: (page: number, size: number) => [...KEYS.all, 'list', page, size] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
  search: (name: string) => [...KEYS.all, 'search', name] as const,
};

export function useDocumentTypesList(page = 0, size = 20) {
  return useQuery({
    queryKey: KEYS.list(page, size),
    queryFn: () => documentTypeService.list(page, size),
  });
}

export function useDocumentTypeDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => documentTypeService.getById(id),
    enabled: !!id,
  });
}

/**
 * Look up a document type by its display name. Used when only the name is
 * known (e.g. document detail responses embed `documentType.type` but not the id).
 */
export function useDocumentTypeByName(name: string) {
  return useQuery({
    queryKey: KEYS.search(name),
    queryFn: () => documentTypeService.searchByName(name),
    enabled: !!name,
  });
}

export function useCreateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentTypeRequest) => documentTypeService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document type created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create document type'),
  });
}

export function useUpdateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentTypeRequest }) =>
      documentTypeService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document type updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update document type'),
  });
}

export function useDeleteDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentTypeService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Document type deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete document type'),
  });
}

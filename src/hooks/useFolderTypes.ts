import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { folderTypeService } from '../api/folderTypeService';
import type { FolderTypeRequest } from '../types/api';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['folderTypes'] as const,
  list: (page: number, size: number) => [...KEYS.all, 'list', page, size] as const,
  active: () => [...KEYS.all, 'active'] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
};

export function useFolderTypesList(page = 0, size = 20) {
  return useQuery({
    queryKey: KEYS.list(page, size),
    queryFn: () => folderTypeService.list(page, size),
  });
}

export function useActiveFolderTypes() {
  return useQuery({
    queryKey: KEYS.active(),
    queryFn: () => folderTypeService.listActive(),
  });
}

export function useFolderTypeDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => folderTypeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateFolderType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FolderTypeRequest) => folderTypeService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder type created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create folder type'),
  });
}

export function useUpdateFolderType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FolderTypeRequest }) =>
      folderTypeService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder type updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update folder type'),
  });
}

export function useDeleteFolderType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => folderTypeService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder type deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete folder type'),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { folderService } from '../api/folderService';
import type { ApiVersionType, CreateFolderRequest, UpdateFolderRequest } from '../types/api';
import { useConfigStore } from '../stores/configStore';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['folders'] as const,
  list: (page: number, size: number) => [...KEYS.all, 'list', page, size] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
  children: (id: string, page: number, size: number) => [...KEYS.all, 'children', id, page, size] as const,
};

export function useFoldersList(page = 0, size = 25) {
  const version = useConfigStore((s) => s.apiVersion);
  return useQuery({
    queryKey: KEYS.list(page, size),
    queryFn: () => folderService.listAll(page, size, version),
  });
}

export function useFolderDetail(id: string) {
  const version = useConfigStore((s) => s.apiVersion);
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => folderService.getById(id, version),
    enabled: !!id,
  });
}

export function useFolderChildren(folderId: string, page = 0, size = 25) {
  const version = useConfigStore((s) => s.apiVersion);
  return useQuery({
    queryKey: KEYS.children(folderId, page, size),
    queryFn: () => folderService.listChildren(folderId, page, size, version),
    enabled: !!folderId,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, version }: { data: CreateFolderRequest; version?: ApiVersionType }) =>
      folderService.create(data, version || '1.1'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create folder'),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, version }: { id: string; data: UpdateFolderRequest; version?: ApiVersionType }) =>
      folderService.update(id, data, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update folder'),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => folderService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Folder deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete folder'),
  });
}

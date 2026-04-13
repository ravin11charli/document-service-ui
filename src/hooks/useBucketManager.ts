import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bucketManagerService } from '../api/bucketManagerService';
import type { CreateStoragePolicyRequest, UpdateStoragePolicyRequest } from '../types/api';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['bucketPolicies'] as const,
  list: (enabledOnly: boolean) => [...KEYS.all, 'list', enabledOnly] as const,
  detail: (id: string) => [...KEYS.all, 'detail', id] as const,
  byFolderType: (id: string) => [...KEYS.all, 'byFolderType', id] as const,
};

export function usePoliciesList(enabledOnly = false) {
  return useQuery({
    queryKey: KEYS.list(enabledOnly),
    queryFn: () => bucketManagerService.listAll(enabledOnly),
  });
}

export function usePolicyDetail(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => bucketManagerService.getById(id),
    enabled: !!id,
  });
}

export function usePolicyByFolderType(folderTypeId: string) {
  return useQuery({
    queryKey: KEYS.byFolderType(folderTypeId),
    queryFn: () => bucketManagerService.getByFolderType(folderTypeId),
    enabled: !!folderTypeId,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoragePolicyRequest) => bucketManagerService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Storage policy created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create policy'),
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoragePolicyRequest }) =>
      bucketManagerService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Policy updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update policy'),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bucketManagerService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Policy deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete policy'),
  });
}

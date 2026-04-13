import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trashService } from '../api/trashService';
import toast from 'react-hot-toast';

const KEYS = {
  all: ['trash'] as const,
  list: (page: number, size: number) => [...KEYS.all, 'list', page, size] as const,
};

export function useTrashList(page = 0, size = 25) {
  return useQuery({
    queryKey: KEYS.list(page, size),
    queryFn: () => trashService.list(page, size),
  });
}

export function useRestoreTrashItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => trashService.restore(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Item restored');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to restore'),
  });
}

export function usePermanentDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => trashService.permanentDelete(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Permanently deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => trashService.emptyTrash(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Trash emptied');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to empty trash'),
  });
}

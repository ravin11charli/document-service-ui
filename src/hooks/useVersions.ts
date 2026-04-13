import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { versionService } from '../api/versionService';
import type { ApiVersionType, RevertVersionRequest } from '../types/api';
import toast from 'react-hot-toast';

const KEYS = {
  list: (docId: string) => ['versions', docId] as const,
};

export function useVersionsList(documentId: string) {
  return useQuery({
    queryKey: KEYS.list(documentId),
    queryFn: () => versionService.list(documentId),
    enabled: !!documentId,
  });
}

export function useUploadNewVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, file, version }: { documentId: string; file: File; version?: ApiVersionType }) =>
      versionService.uploadNewVersion(documentId, file, true, version),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.list(vars.documentId) });
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('New version uploaded');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to upload version'),
  });
}

export function useRevertVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: RevertVersionRequest }) =>
      versionService.revert(documentId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.list(vars.documentId) });
      toast.success('Version reverted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to revert version'),
  });
}

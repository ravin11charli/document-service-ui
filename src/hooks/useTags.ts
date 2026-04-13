import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagService } from '../api/tagService';
import type { CreateTagRequest, UpdateDocumentTagsRequest } from '../types/api';
import toast from 'react-hot-toast';

const KEYS = { all: ['tags'] as const };

export function useTagsList() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => tagService.list(),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Tag created');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create tag'),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Tag deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete tag'),
  });
}

export function useUpdateDocumentTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDocumentTagsRequest) => tagService.updateDocumentTags(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document tags updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update tags'),
  });
}

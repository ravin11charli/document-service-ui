import apiClient from './client';
import type {
  ApiResponse,
  CreateTagRequest,
  TagResponse,
  UpdateDocumentTagsRequest,
} from '../types/api';

const BASE = '/api/tag';

export const tagService = {
  list: () =>
    apiClient.get<ApiResponse<TagResponse[]>>(BASE, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  create: (data: CreateTagRequest) =>
    apiClient.post<ApiResponse<TagResponse>>(BASE, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  delete: (tagId: string) =>
    apiClient.delete<ApiResponse<Record<string, string>>>(`${BASE}/${tagId}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  updateDocumentTags: (data: UpdateDocumentTagsRequest) =>
    apiClient.post<ApiResponse<Record<string, string>>>(`${BASE}/update-tags`, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),
};

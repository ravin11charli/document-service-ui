import apiClient from './client';
import type {
  ApiResponse,
  DocumentResponse,
  PaginatedResponse,
  TrashResponse,
} from '../types/api';

const BASE = '/api/trash';

export const trashService = {
  list: (page = 0, size = 25) =>
    apiClient.get<ApiResponse<PaginatedResponse<TrashResponse>>>(BASE, {
      params: { page, size },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  restore: (itemId: string) =>
    apiClient.post<ApiResponse<void>>(`${BASE}/${itemId}/restore`, null, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  permanentDelete: (itemId: string) =>
    apiClient.delete(`${BASE}/${itemId}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  emptyTrash: () =>
    apiClient.delete(BASE, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  getTrashFolderChildren: (folderId: string, page = 0, size = 25) =>
    apiClient.get<ApiResponse<PaginatedResponse<DocumentResponse>>>(`${BASE}/${folderId}/children`, {
      params: { page, size },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),
};

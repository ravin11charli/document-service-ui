import apiClient from './client';
import type {
  ApiResponse,
  FolderTypeRequest,
  FolderTypeResponse,
  PaginatedResponse,
} from '../types/api';

const BASE = '/api/folder-types';

export const folderTypeService = {
  create: (data: FolderTypeRequest) =>
    apiClient.post<ApiResponse<FolderTypeResponse>>(BASE, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  list: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PaginatedResponse<FolderTypeResponse>>>(BASE, {
      params: { page, size },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  listActive: () =>
    apiClient.get<ApiResponse<FolderTypeResponse[]>>(`${BASE}/active`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<FolderTypeResponse>>(`${BASE}/${id}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  update: (id: string, data: FolderTypeRequest) =>
    apiClient.put<ApiResponse<FolderTypeResponse>>(`${BASE}/${id}`, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  deleteMultiple: (ids: string[]) =>
    apiClient.delete<ApiResponse<string>>(BASE, {
      data: ids,
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),
};

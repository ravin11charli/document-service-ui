import apiClient from './client';
import type {
  ApiResponse,
  CreateStoragePolicyRequest,
  StoragePolicyResponse,
  UpdateStoragePolicyRequest,
} from '../types/api';

const BASE = '/api/bucket-manager';

export const bucketManagerService = {
  create: (data: CreateStoragePolicyRequest) =>
    apiClient.post<ApiResponse<StoragePolicyResponse>>(BASE, data).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<StoragePolicyResponse>>(`${BASE}/${id}`).then((r) => r.data),

  getByFolderType: (folderTypeId: string) =>
    apiClient.get<ApiResponse<StoragePolicyResponse>>(`${BASE}/by-folder-type/${folderTypeId}`).then((r) => r.data),

  listAll: (enabledOnly = false) =>
    apiClient.get<ApiResponse<StoragePolicyResponse[]>>(BASE, {
      params: { enabledOnly },
    }).then((r) => r.data),

  update: (id: string, data: UpdateStoragePolicyRequest) =>
    apiClient.put<ApiResponse<StoragePolicyResponse>>(`${BASE}/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`).then((r) => r.data),
};

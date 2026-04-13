import apiClient from './client';
import type {
  ApiResponse,
  ApiVersionType,
  CreateFolderRequest,
  DocumentResponse,
  FolderResponse,
  PaginatedResponse,
  UpdateFolderRequest,
} from '../types/api';

const BASE = '/api/folders';

export const folderService = {
  create: (data: CreateFolderRequest, version: ApiVersionType = '1.1') => {
    // v1.0 expects applicationName instead of folderName
    const payload = version === '1.0'
      ? { applicationName: data.folderName, parentId: data.parentId, workspaceId: data.workspaceId, folderTypeId: data.folderTypeId, attributes: data.attributes, currentLifecycleState: data.currentLifecycleState }
      : data;
    return apiClient.post<ApiResponse<FolderResponse>>(BASE, payload, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data);
  },

  listAll: (page = 0, size = 25, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<PaginatedResponse<FolderResponse>>>(`${BASE}/all-folder`, {
      params: { page, size },
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  getById: (folderId: string, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<FolderResponse>>(`${BASE}/${folderId}`, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  listChildren: (folderId: string, page = 0, size = 25, version: ApiVersionType = '1.1') => {
    // v1.0 uses applicationId param, v1.1 uses folderId param
    const paramKey = version === '1.0' ? 'applicationId' : 'folderId';
    return apiClient.get<ApiResponse<PaginatedResponse<DocumentResponse>>>(BASE, {
      params: { [paramKey]: folderId, page, size },
      headers: { 'X-API-Version': version },
    }).then((r) => r.data);
  },

  update: (folderId: string, data: UpdateFolderRequest, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<FolderResponse>>(`${BASE}/${folderId}`, data, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  delete: (folderId: string) =>
    apiClient.delete(`${BASE}/${folderId}`, {
      headers: { 'X-API-Version': '1.1' },
    }).then((r) => r.data),

  updateLifecycle: (folderId: string, currentLifecycleState: string, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<FolderResponse>>(
      `${BASE}/${folderId}`,
      { currentLifecycleState },
      { headers: { 'X-API-Version': version } }
    ).then((r) => r.data),

  updateAttributes: (folderId: string, attributes: Record<string, unknown>, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<FolderResponse>>(
      `${BASE}/${folderId}`,
      { attributes },
      { headers: { 'X-API-Version': version } }
    ).then((r) => r.data),
};

import apiClient from './client';
import type {
  ApiResponse,
  ApiVersionType,
  DocumentResponse,
  RevertVersionRequest,
  RevertVersionResponse,
  VersionInfoResponse,
} from '../types/api';

const BASE = '/api/documents';

export const versionService = {
  list: (documentId: string) =>
    apiClient.get<ApiResponse<VersionInfoResponse[]>>(`${BASE}/${documentId}/versions`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  uploadNewVersion: (documentId: string, file: File, finalSave = true, version: ApiVersionType = '1.1') => {
    const formData = new FormData();
    formData.append('document', file);
    return apiClient.post<ApiResponse<DocumentResponse>>(
      `${BASE}/${documentId}/versions`,
      formData,
      {
        params: { finalSave },
        headers: {
          'X-API-Version': version,
          'Content-Type': 'multipart/form-data',
        },
      }
    ).then((r) => r.data);
  },

  revert: (documentId: string, data: RevertVersionRequest) =>
    apiClient.post<ApiResponse<RevertVersionResponse>>(
      `${BASE}/${documentId}/versions/revert`,
      data,
      { headers: { 'X-API-Version': '1.0' } }
    ).then((r) => r.data),

  downloadVersion: (documentId: string, versionId: string) =>
    apiClient.get(`${BASE}/${documentId}/versions/${versionId}/download`, {
      responseType: 'blob',
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),
};

import apiClient from './client';
import type {
  ApiResponse,
  ApiVersionType,
  BatchUploadResponse,
  CopyRequest,
  CreateDocumentMetadata,
  DocumentResponse,
  PaginatedResponse,
  UpdateDocumentRequest,
} from '../types/api';

const BASE = '/api/documents';

export const documentService = {
  // Upload document (multipart) - v1.0, v1.1, v1.2, v1.3
  upload: (
    file: File,
    metadata?: CreateDocumentMetadata,
    version: ApiVersionType = '1.1'
  ) => {
    const formData = new FormData();
    formData.append('document', file);
    if (metadata) {
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    }
    return apiClient.post<ApiResponse<DocumentResponse>>(BASE, formData, {
      headers: {
        'X-API-Version': version,
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data);
  },

  // Stream upload - v1.2
  uploadStream: (
    file: File,
    metadata?: CreateDocumentMetadata
  ) => {
    const formData = new FormData();
    formData.append('document', file);
    if (metadata) {
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    }
    return apiClient.post<ApiResponse<DocumentResponse>>(BASE, formData, {
      headers: {
        'X-API-Version': '1.2',
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data);
  },

  // List ALL documents (root + nested) by tenant+workspace - v1.0
  // Backend reads tenant/workspace from headers; returns paginated DocumentResponse
  listAll: (page = 0, size = 25) =>
    apiClient.get<ApiResponse<PaginatedResponse<DocumentResponse>>>(`${BASE}/all`, {
      params: { page, size },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // List documents — v1.0 uses applicationId, v1.1 uses folderId
  list: (params: {
    folderId?: string;
    page?: number;
    size?: number;
    sort?: string;
  }, version: ApiVersionType = '1.1') => {
    const folderParam = version === '1.0'
      ? { applicationId: params.folderId }
      : { folderId: params.folderId };
    return apiClient.get<ApiResponse<PaginatedResponse<DocumentResponse>>>(BASE, {
      params: {
        ...folderParam,
        page: params.page ?? 0,
        size: params.size ?? 25,
        sort: params.sort ?? 'createdAt,desc',
      },
      headers: { 'X-API-Version': version },
    }).then((r) => r.data);
  },

  // Get by ID
  getById: (id: string, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<DocumentResponse>>(`${BASE}/${id}`, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  // Update (PATCH)
  update: (id: string, data: UpdateDocumentRequest, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<DocumentResponse>>(`${BASE}/${id}`, data, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  // Delete
  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // Copy
  copy: (id: string, data: CopyRequest) =>
    apiClient.post<ApiResponse<DocumentResponse>>(`${BASE}/${id}/copy`, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // Update attributes only
  updateAttributes: (id: string, attributes: Record<string, string>, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<DocumentResponse>>(`${BASE}/${id}/attributes`, attributes, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  // Download
  download: (id: string, version: ApiVersionType = '1.0') =>
    apiClient.get(`${BASE}/${id}/download`, {
      responseType: 'blob',
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  // Open
  open: (id: string, version: ApiVersionType = '1.0') =>
    apiClient.get(`${BASE}/${id}/open`, {
      responseType: 'blob',
      params: { context: 'mydrive' },
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  // Presigned download URL
  getPresignedDownloadUrl: (id: string) =>
    apiClient.get<ApiResponse<{ url: string }>>(`${BASE}/${id}/download/presigned-url`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // Create from template
  createFromTemplate: (templateType: string, metadata: CreateDocumentMetadata) =>
    apiClient.post<ApiResponse<DocumentResponse>>(`${BASE}/from-template`, metadata, {
      params: { templateType },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // Batch upload
  batchUpload: (files: File[], parentId?: string, conflictResolution?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.post<ApiResponse<BatchUploadResponse>>(`${BASE}/batch`, formData, {
      params: { parentId, conflictResolution },
      headers: {
        'X-API-Version': '1.1',
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data);
  },
};

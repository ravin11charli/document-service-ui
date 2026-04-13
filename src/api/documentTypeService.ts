import apiClient from './client';
import type {
  ApiResponse,
  DocumentTypeRequest,
  DocumentTypeResponse,
  PaginatedResponse,
} from '../types/api';

const BASE = '/api/document-types';

export const documentTypeService = {
  create: (data: DocumentTypeRequest) =>
    apiClient.post<ApiResponse<DocumentTypeResponse>>(BASE, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  list: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PaginatedResponse<DocumentTypeResponse>>>(BASE, {
      params: { page, size },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<DocumentTypeResponse>>(`${BASE}/${id}`, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  searchByName: (name: string) =>
    apiClient.get<ApiResponse<DocumentTypeResponse>>(`${BASE}/search`, {
      params: { name },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  update: (id: string, data: DocumentTypeRequest) =>
    apiClient.put<ApiResponse<string>>(`${BASE}/${id}`, data, {
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

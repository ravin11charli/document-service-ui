import apiClient from './client';
import type {
  ApiResponse,
  ApiVersionType,
  DocumentResponse,
  FolderResponse,
  UpdateFolderByAttributeRequest,
} from '../types/api';

const SEARCH_BASE = '/api/search';
const LTI_BASE = '/api/lti';

export const searchService = {
  // Search APIs
  documentsByDocumentType: (documentTypeId: string) =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${SEARCH_BASE}/documents/by-document-type`, {
      params: { documentTypeId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  documentsByAttributeName: (attributeName: string) =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${SEARCH_BASE}/documents/by-attribute-name`, {
      params: { attributeName },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  documentsByAttribute: (attributeName: string, attributeValue: string) =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${SEARCH_BASE}/documents/by-attribute`, {
      params: { attributeName, attributeValue },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  foldersByFolderType: (folderTypeId: string) =>
    apiClient.get<ApiResponse<FolderResponse[]>>(`${SEARCH_BASE}/folders/by-folder-type`, {
      params: { folderTypeId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  foldersByAttributeName: (attributeName: string) =>
    apiClient.get<ApiResponse<FolderResponse[]>>(`${SEARCH_BASE}/folders/by-attribute-name`, {
      params: { attributeName },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  foldersByAttribute: (attributeName: string, attributeValue: string) =>
    apiClient.get<ApiResponse<FolderResponse[]>>(`${SEARCH_BASE}/folders/by-attribute`, {
      params: { attributeName, attributeValue },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  documentsByFolderAttribute: (attributeName: string, attributeValue: string) =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${SEARCH_BASE}/documents/by-folder-attribute`, {
      params: { attributeName, attributeValue },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  documentsByFolderType: (folderTypeId: string) =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${SEARCH_BASE}/documents/by-folder-type`, {
      params: { folderTypeId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // LTI Search APIs
  searchByToken: (tokenNumber: string, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${LTI_BASE}/search/token/${tokenNumber}`, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  searchByAcknowledgement: (ackNumber: string, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${LTI_BASE}/search/acknowledgement/${ackNumber}`, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  searchByPan: (panNumber: string, version: ApiVersionType = '1.1') =>
    apiClient.get<ApiResponse<DocumentResponse[]>>(`${LTI_BASE}/search/pan/${panNumber}`, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),

  updateFolderByAttribute: (data: UpdateFolderByAttributeRequest, version: ApiVersionType = '1.1') =>
    apiClient.patch<ApiResponse<FolderResponse>>(`${LTI_BASE}/folder/update-by-attribute`, data, {
      headers: { 'X-API-Version': version },
    }).then((r) => r.data),
};

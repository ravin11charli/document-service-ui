import apiClient from './client';
import type { ApiResponse, FolderResponse, UpdateFolderByAttributeRequest } from '../types/api';

const BASE = '/api/lti';

export const ltiService = {
  updateFolderByAttribute: (data: UpdateFolderByAttributeRequest) =>
    apiClient.patch<ApiResponse<FolderResponse>>(`${BASE}/folder/update-by-attribute`, data, {
      headers: { 'X-API-Version': '1.1' },
    }).then((r) => r.data),
};

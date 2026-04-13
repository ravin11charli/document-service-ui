import apiClient from './client';
import type { ApiResponse, PaginatedResponse, ResourceResponse } from '../types/api';
import { useConfigStore } from '../stores/configStore';

export const navigationService = {
  getMyDrive: (page = 0, size = 25) => {
    const workspaceId = useConfigStore.getState().workspaceId;
    return apiClient.get<ApiResponse<PaginatedResponse<ResourceResponse>>>(
      `/workspaces/${workspaceId}/resources`,
      {
        params: { page, size },
        headers: { 'X-API-Version': '1.0' },
      }
    ).then((r) => r.data);
  },

  getFolderContents: (parentId: string, page = 0, size = 25) =>
    apiClient.get<ApiResponse<PaginatedResponse<ResourceResponse>>>(
      `/folders/${parentId}/resources`,
      {
        params: { page, size },
        headers: { 'X-API-Version': '1.0' },
      }
    ).then((r) => r.data),
};

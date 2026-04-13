import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useConfigStore } from '../stores/configStore';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { tenantId, userId, workspaceId, apiVersion } = useConfigStore.getState();

  config.headers.set('X-Tenant-Id', tenantId);
  config.headers.set('X-User-Id', userId);
  config.headers.set('X-Workspace-Id', workspaceId);

  // Allow per-request version override
  if (!config.headers.get('X-API-Version')) {
    config.headers.set('X-API-Version', apiVersion);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    let data = error.response?.data;
    // Blob responses (downloads/previews) wrap JSON errors in a Blob — unwrap them
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        data = JSON.parse(text);
      } catch { /* leave as-is */ }
    }

    // Backend can return either Spring Problem-Detail (title/detail) or ApiResponse (message/error)
    const title = data?.title || data?.message || data?.error || error.message || 'Request failed';
    const detail = data?.detail || data?.message || null;
    const errorCode = data?.errorCode || null;

    return Promise.reject({
      status,
      message: title,
      title,
      detail,
      errorCode,
      details: data?.details || data || null,
      raw: error,
    });
  }
);

export default apiClient;

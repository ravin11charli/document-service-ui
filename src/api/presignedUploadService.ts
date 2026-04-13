import axios from 'axios';
import apiClient from './client';
import type {
  ApiResponse,
  DocumentResponse,
  PresignedUploadCompleteRequest,
  PresignedUploadInitiateRequest,
  PresignedUploadInitiateResponse,
} from '../types/api';

const BASE = '/api/documents/upload';

export interface ChunkUploadProgress {
  partNumber: number;
  totalParts: number;
  uploaded: number;
  total: number;
}

export const presignedUploadService = {
  initiate: (data: PresignedUploadInitiateRequest) =>
    apiClient.post<ApiResponse<PresignedUploadInitiateResponse> | PresignedUploadInitiateResponse>(`${BASE}/initiate`, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => {
      // Backend may return either ApiResponse-wrapped or raw PresignedUploadInitiateResponse
      const body: any = r.data;
      const inner: PresignedUploadInitiateResponse = body?.parts ? body : body?.data;
      if (!inner || !inner.parts) {
        throw new Error('Presigned initiate returned invalid payload (missing parts)');
      }
      return inner;
    }),

  complete: (data: PresignedUploadCompleteRequest) =>
    apiClient.post<DocumentResponse>(`${BASE}/complete`, data, {
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  getStatus: (documentId: string) =>
    apiClient.get(`${BASE}/status`, {
      params: { documentId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  abort: (documentId: string) =>
    apiClient.post(`${BASE}/abort`, null, {
      params: { documentId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),

  // Upload chunks with retry and resume support
  uploadChunks: async (
    file: File,
    initResponse: PresignedUploadInitiateResponse,
    onProgress?: (p: ChunkUploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{ partNumber: number; etag: string }[]> => {
    const completedParts: { partNumber: number; etag: string }[] = [];
    const { parts, partSize } = initResponse;

    // Upload parts in parallel batches (concurrency = 4)
    const CONCURRENCY = 4;
    const isMultipart = initResponse.uploadStrategy === 'MULTIPART';
    const uploadHeaders: Record<string, string> = isMultipart
      ? {}
      : { 'Content-Type': file.type || 'application/octet-stream', ...(initResponse.requiredHeaders || {}) };

    const partProgress = new Map<number, number>();

    const uploadOnePart = async (part: typeof parts[0]) => {
      if (abortSignal?.aborted) throw new Error('Upload aborted');

      const start = (part.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      let retries = 3;
      while (retries > 0) {
        try {
          const response = await axios.put(part.presignedUrl, chunk, {
            headers: uploadHeaders,
            transformRequest: [(d: any) => d],
            signal: abortSignal,
            onUploadProgress: (e) => {
              partProgress.set(part.partNumber, e.loaded);
              const totalUploaded = Array.from(partProgress.values()).reduce((a, b) => a + b, 0);
              onProgress?.({
                partNumber: completedParts.length + 1,
                totalParts: parts.length,
                uploaded: totalUploaded,
                total: file.size,
              });
            },
          });

          const etag = response.headers['etag'] || response.headers['ETag'] || '';
          return { partNumber: part.partNumber, etag: etag.replace(/"/g, '') };
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 2000));
        }
      }
      throw new Error(`Failed to upload part ${part.partNumber}`);
    };

    // Process in batches of CONCURRENCY
    for (let i = 0; i < parts.length; i += CONCURRENCY) {
      if (abortSignal?.aborted) throw new Error('Upload aborted');
      const batch = parts.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(uploadOnePart));
      completedParts.push(...results);
    }

    return completedParts;
  },
};

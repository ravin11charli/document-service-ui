import apiClient from './client';
import type { NlpRawTextResponse } from '../types/api';

export const nlpService = {
  getRawText: (fId: string) =>
    apiClient.get<NlpRawTextResponse>('/api/nlp/raw-text', {
      params: { fId },
      headers: { 'X-API-Version': '1.0' },
    }).then((r) => r.data),
};

import { transport as apiClient } from '../transport.js';

const PROFILE_BASE = '/api/expert/profile';

export const expertProfileService = Object.freeze({
  getWorkspace: () => apiClient.get(PROFILE_BASE, { authType: 'expert' }),
  updateProfile: (data) => apiClient.put(PROFILE_BASE, data, { authType: 'expert' }),
  uploadAvatar: (file) => {
    const body = new FormData();
    body.append('avatar', file);
    return apiClient.post(`${PROFILE_BASE}/avatar`, body, { authType: 'expert', timeoutMs: 60000 });
  },
  deleteAvatar: () => apiClient.delete(`${PROFILE_BASE}/avatar`, { authType: 'expert' }),
  preview: () => apiClient.get(`${PROFILE_BASE}/preview`, { authType: 'expert' }),
  publish: () => apiClient.post(`${PROFILE_BASE}/publish`, undefined, { authType: 'expert' }),
  unpublish: () => apiClient.post(`${PROFILE_BASE}/unpublish`, undefined, { authType: 'expert' }),
  getScopes: () => apiClient.get('/api/expert/verified-scopes', { authType: 'expert' }),
  getAvailability: () => apiClient.get('/api/expert/availability', { authType: 'expert' }),
  updateAvailability: (data) => apiClient.put('/api/expert/availability', data, { authType: 'expert' }),
  getPublicProfile: (slug) => apiClient.get(`/api/experts/${encodeURIComponent(slug)}`),
});

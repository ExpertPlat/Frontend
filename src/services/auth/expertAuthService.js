import { apiClient } from '../../api/client.js';

const BASE = '/api/expert/auth';

export const expertAuthService = Object.freeze({
  register: (data) => apiClient.post(`${BASE}/register`, data),
  login: (data) => apiClient.post(`${BASE}/login`, data),
  me: () => apiClient.get(`${BASE}/me`, { authType: 'expert' }),
  logout: () => apiClient.post(`${BASE}/logout`, undefined, { authType: 'expert' }),
  logoutAll: () => apiClient.post(`${BASE}/logout-all`, undefined, { authType: 'expert' }),
  forgotPassword: (data) => apiClient.post(`${BASE}/forgot-password`, data),
  resetPassword: (data) => apiClient.post(`${BASE}/reset-password`, data),
  changePassword: (data) => apiClient.put(`${BASE}/password`, data, { authType: 'expert' }),
  sendVerification: () => apiClient.post(`${BASE}/email/verification-notification`, undefined, { authType: 'expert' }),
  verifyEmail: ({ id, hash, rawQuery = '', verificationUrl = '' }) => (
    verificationUrl
      ? apiClient.get(verificationUrl)
      : apiClient.get(
        `${BASE}/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`,
        { rawQuery },
      )
  ),
});

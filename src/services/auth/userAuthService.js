import { apiClient } from '../../api/client.js';

export const userAuthService = Object.freeze({
  register: (data) => apiClient.post('/api/register', data),
  login: (data) => apiClient.post('/api/login', data),
  me: () => apiClient.get('/api/user', { authType: 'user' }),
  logout: () => apiClient.post('/api/logout', undefined, { authType: 'user' }),
  logoutAll: () => apiClient.post('/api/logout-all', undefined, { authType: 'user' }),
  forgotPassword: (data) => apiClient.post('/api/forgot-password', data),
  resetPassword: (data) => apiClient.post('/api/reset-password', data),
  sendVerification: () => apiClient.post('/api/email/verification-notification', undefined, { authType: 'user' }),
  verifyEmail: ({ id, hash, rawQuery = '', verificationUrl = '' }) => (
    verificationUrl
      ? apiClient.get(verificationUrl)
      : apiClient.get(
        `/api/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`,
        { rawQuery },
      )
  ),
});

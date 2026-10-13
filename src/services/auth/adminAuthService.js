import { transport as apiClient } from '../transport.js';

const BASE = '/api/admin/auth';

export const adminAuthService = Object.freeze({
  login: (data) => apiClient.post(`${BASE}/login`, { device_name: 'Admin Dashboard', ...data }),
  me: () => apiClient.get(`${BASE}/me`, { authType: 'admin', skipForbiddenRefresh: true }),
  logout: () => apiClient.post(`${BASE}/logout`, undefined, { authType: 'admin' }),
  logoutAll: () => apiClient.post(`${BASE}/logout-all`, undefined, { authType: 'admin' }),
  acceptInvitation: (data) => apiClient.post(`${BASE}/invitations/accept`, data),
});

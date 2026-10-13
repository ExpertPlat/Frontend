import { transport as apiClient } from '../transport.js';

const BASE = '/api/admin';

export const adminAuthorizationService = Object.freeze({
  listRoles: () => apiClient.get(`${BASE}/roles`, { authType: 'admin' }),
  getRole: (roleId) => apiClient.get(`${BASE}/roles/${encodeURIComponent(roleId)}`, { authType: 'admin' }),
  createRole: (payload) => apiClient.post(`${BASE}/roles`, payload, { authType: 'admin' }),
  updateRole: (roleId, payload) => apiClient.put(`${BASE}/roles/${encodeURIComponent(roleId)}`, payload, { authType: 'admin' }),
  deleteRole: (roleId) => apiClient.delete(`${BASE}/roles/${encodeURIComponent(roleId)}`, { authType: 'admin' }),
  listPermissions: () => apiClient.get(`${BASE}/permissions`, { authType: 'admin' }),

  listUsers: (page = 1) => apiClient.get(`${BASE}/users?page=${encodeURIComponent(page)}`, { authType: 'admin' }),
  getUser: (userId) => apiClient.get(`${BASE}/users/${encodeURIComponent(userId)}`, { authType: 'admin' }),
  listExperts: (page = 1) => apiClient.get(`${BASE}/experts?page=${encodeURIComponent(page)}`, { authType: 'admin' }),
  getExpert: (expertId) => apiClient.get(`${BASE}/experts/${encodeURIComponent(expertId)}`, { authType: 'admin' }),

  listAdmins: (page = 1) => apiClient.get(`${BASE}/admins?page=${encodeURIComponent(page)}`, { authType: 'admin' }),
  getAdmin: (adminId) => apiClient.get(`${BASE}/admins/${encodeURIComponent(adminId)}`, { authType: 'admin' }),
  createAdmin: (payload) => apiClient.post(`${BASE}/admins`, payload, { authType: 'admin' }),
  updateAdmin: (adminId, payload) => apiClient.patch(`${BASE}/admins/${encodeURIComponent(adminId)}`, payload, { authType: 'admin' }),
  updateAdminStatus: (adminId, isActive) => apiClient.patch(
    `${BASE}/admins/${encodeURIComponent(adminId)}/status`,
    { is_active: Boolean(isActive) },
    { authType: 'admin' },
  ),
  resendAdminInvitation: (adminId) => apiClient.post(
    `${BASE}/admins/${encodeURIComponent(adminId)}/invitation`,
    undefined,
    { authType: 'admin' },
  ),
  assignRole: (adminId, roleId) => apiClient.post(
    `${BASE}/admins/${encodeURIComponent(adminId)}/roles/${encodeURIComponent(roleId)}`,
    undefined,
    { authType: 'admin' },
  ),
  revokeRole: (adminId, roleId) => apiClient.delete(
    `${BASE}/admins/${encodeURIComponent(adminId)}/roles/${encodeURIComponent(roleId)}`,
    { authType: 'admin' },
  ),
});

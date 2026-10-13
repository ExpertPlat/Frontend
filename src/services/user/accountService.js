import { userApi } from '../http.js';

/** Profile, preferences, consents, data-rights requests, reusable contexts and notifications (API handoff sections 12 and 16). */
export const profileService = Object.freeze({
  me: () => userApi.get('/api/user'),
  update: (payload) => userApi.patch('/api/user/profile', payload),
  preferences: () => userApi.get('/api/user/preferences'),
  updatePreferences: (payload) => userApi.patch('/api/user/preferences', payload),
  consents: () => userApi.get('/api/user/consents'),
  setConsent: (purpose, decision) => userApi.post('/api/user/consents', { purpose, decision }),
  dataRequests: () => userApi.get('/api/user/data-requests'),
  requestData: (type) => userApi.post('/api/user/data-requests', { type }),
});

export const contextsService = Object.freeze({
  list: () => userApi.get('/api/user/contexts'),
  create: (payload) => userApi.post('/api/user/contexts', payload),
  archive: (id) => userApi.post(`/api/user/contexts/${id}/archive`, {}),
  restore: (id) => userApi.post(`/api/user/contexts/${id}/restore`, {}),
  remove: (id) => userApi.delete(`/api/user/contexts/${id}`),
});

export const userNotificationsService = Object.freeze({
  list: () => userApi.get('/api/user/notifications'),
  markRead: (id) => userApi.post(`/api/user/notifications/${encodeURIComponent(id)}/read`, {}),
});

export const catalogService = Object.freeze({
  countries: () => userApi.get('/api/catalog/countries'),
  specialties: () => userApi.get('/api/catalog/specialties'),
});

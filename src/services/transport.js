import { apiClient } from '../api/client.js';

/** Drop-in `apiClient` used by the older feature services (KYC, professional profile): always the real backend. */
export const transport = Object.freeze({
  get: (path, options) => apiClient.get(path, options),
  post: (path, body, options) => apiClient.post(path, body, options),
  put: (path, body, options) => apiClient.put(path, body, options),
  patch: (path, body, options) => apiClient.patch(path, body, options),
  delete: (path, options) => apiClient.delete(path, options),
  getBlob: (path, options) => apiClient.getBlob(path, options),
});

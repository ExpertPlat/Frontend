import { apiClient } from '../api/client.js';
import { getApiLanguage } from './config.js';

/**
 * Single door for every dashboard call.
 *
 *   request('POST', '/api/v2/user/cases', { realm: 'user', body, idempotencyKey })
 *
 * api/client.js (Bearer token of the realm, error normalisation, timeouts).
 *
 * Resolves with the whole envelope; use `data()` / `list()` below to unwrap it.
 */
export async function request(method, path, { realm = 'user', body, query, idempotencyKey, timeoutMs } = {}) {
  const headers = { 'Accept-Language': getApiLanguage() };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const search = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') search.set(key, String(value)); });
  const rawQuery = search.toString() ? `?${search}` : '';
  const options = { authType: realm, headers, rawQuery, timeoutMs };
  switch (method) {
    case 'GET': return apiClient.get(path, options);
    case 'POST': return apiClient.post(path, body, options);
    case 'PUT': return apiClient.put(path, body, options);
    case 'PATCH': return apiClient.patch(path, body, options);
    case 'DELETE': return apiClient.delete(path, options);
    default: throw new Error(`Unsupported method ${method}`);
  }
}

/** `{ status, message, data }` -> data (or the payload itself when the endpoint is not wrapped). */
export const unwrap = (envelope) => (envelope && typeof envelope === 'object' && 'data' in envelope ? envelope.data : envelope);

export const makeApi = (realm) => ({
  get: (path, options = {}) => request('GET', path, { ...options, realm }).then(unwrap),
  post: (path, body, options = {}) => request('POST', path, { ...options, body, realm }).then(unwrap),
  put: (path, body, options = {}) => request('PUT', path, { ...options, body, realm }).then(unwrap),
  patch: (path, body, options = {}) => request('PATCH', path, { ...options, body, realm }).then(unwrap),
  delete: (path, options = {}) => request('DELETE', path, { ...options, realm }).then(unwrap),
});

export const userApi = makeApi('user');
export const expertApi = makeApi('expert');

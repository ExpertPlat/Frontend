import { createClientError, createHttpError } from './errorHandler.js';
import { getToken } from '../utils/tokenManager.js';

const DEFAULT_TIMEOUT_MS = 15000;
let unauthorizedHandler = null;
let forbiddenHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

export function setForbiddenHandler(handler) {
  forbiddenHandler = typeof handler === 'function' ? handler : null;
  return () => {
    if (forbiddenHandler === handler) forbiddenHandler = null;
  };
}

function getBaseUrl() {
  const raw = import.meta.env?.VITE_API_BASE_URL || (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : '');
  if (!raw || typeof raw !== 'string') {
    throw createClientError('VITE_API_BASE_URL is not configured.', 'CONFIG_ERROR');
  }
  return raw.replace(/\/+$/, '');
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return '';
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

function resolveRequestUrl(endpoint, rawQuery = '') {
  const baseUrl = getBaseUrl();
  if (/^https?:\/\//i.test(endpoint || '')) {
    const target = new URL(endpoint);
    const apiOrigin = new URL(baseUrl).origin;
    if (target.origin !== apiOrigin) {
      throw createClientError('Refused to send an authenticated API request to a different origin.', 'UNSAFE_API_URL');
    }
    return `${target.toString()}${rawQuery}`;
  }
  return `${baseUrl}${normalizeEndpoint(endpoint)}${rawQuery}`;
}

async function parseResponse(response, responseType = 'json') {
  if (response.status === 204) return null;
  if (responseType === 'blob') return response.blob();

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    authType,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    rawQuery = '',
    responseType = 'json',
    skipForbiddenRefresh = false,
  } = options;

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = {
    Accept: responseType === 'blob' ? '*/*' : 'application/json',
    ...headers,
  };

  let requestBody = body;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  if (authType) {
    const token = getToken(authType);
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(resolveRequestUrl(endpoint, rawQuery), {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await parseResponse(response, 'json');
      if (response.status === 401 && authType) unauthorizedHandler?.(authType);
      if (response.status === 403 && authType === 'admin' && !skipForbiddenRefresh) {
        try {
          await forbiddenHandler?.({ endpoint, method, payload: errorPayload });
        } catch {
          // Preserve the original 403 response. Session refresh is best-effort.
        }
      }
      throw createHttpError(response, errorPayload);
    }

    const payload = await parseResponse(response, responseType);
    if (responseType !== 'blob' && payload?.status === false) {
      throw createHttpError(response, payload);
    }

    if (responseType === 'blob') {
      return {
        data: payload,
        headers: response.headers,
        status: response.status,
      };
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createClientError('Request timed out.', 'TIMEOUT', error);
    }
    if (error?.name === 'ApiError') throw error;
    throw createClientError('Network request failed.', 'NETWORK_ERROR', error);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export const apiClient = Object.freeze({
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  getBlob: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET', responseType: 'blob' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
});

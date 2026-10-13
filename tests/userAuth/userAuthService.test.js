import test from 'node:test';
import assert from 'node:assert/strict';
import { setUnauthorizedHandler } from '../../src/api/client.js';
import { userAuthService } from '../../src/services/auth/userAuthService.js';
import { clearToken, getTokenRecord, setToken } from '../../src/utils/tokenManager.js';
import { getBackendErrorCode, getRetryAfterSeconds, USER_AUTH_CODES } from '../../src/features/auth/utils/userAuthErrors.js';
import { resolveEmailVerificationCallback } from '../../src/features/auth/utils/emailVerificationCallback.js';
import { getUserVerificationState, isFullUserAccess } from '../../src/features/auth/utils/userSessionPolicy.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

function installBrowserStorage() {
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
}

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json', ...headers } });
}

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalBaseUrl = process.env.VITE_API_BASE_URL;
process.env.VITE_API_BASE_URL = 'https://api.example.test';

test.beforeEach(() => {
  installBrowserStorage();
  setUnauthorizedHandler(null);
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const type of ['user', 'expert', 'admin']) clearToken(type);
  setUnauthorizedHandler(null);
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});


test('registration policy never treats an unverified or limited token as unrestricted access', () => {
  assert.equal(getUserVerificationState({ email_verified: false, user: { id: 1 } }), false);
  assert.equal(isFullUserAccess({ email_verified: false, token_scope: 'full_access', user: { id: 1 } }, { requireExplicitFullScope: true }), false);
  assert.equal(isFullUserAccess({ email_verified: true, token_scope: 'verification_only', user: { id: 1 } }, { requireExplicitFullScope: true }), false);
  assert.equal(isFullUserAccess({ email_verified: true, token_scope: 'full_access', user: { id: 1 } }, { requireExplicitFullScope: true }), true);
});

test('user auth service uses the documented Sprint 0 paths', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return jsonResponse({ status: true, data: { user: { id: 1 }, token: 'token', token_type: 'Bearer' } });
  };

  await userAuthService.register({ name: 'User', email: 'u@example.test', password: 'secret', password_confirmation: 'secret' });
  await userAuthService.login({ email: 'u@example.test', password: 'secret' });
  setToken('user', 'user-token');
  await userAuthService.me();
  await userAuthService.sendVerification();
  await userAuthService.logout();
  await userAuthService.logoutAll();
  await userAuthService.forgotPassword({ email: 'u@example.test' });
  await userAuthService.resetPassword({ email: 'u@example.test', token: 'reset', password: 'newsecret', password_confirmation: 'newsecret' });

  assert.deepEqual(requests.map(({ url }) => new URL(url).pathname), [
    '/api/register',
    '/api/login',
    '/api/user',
    '/api/email/verification-notification',
    '/api/logout',
    '/api/logout-all',
    '/api/forgot-password',
    '/api/reset-password',
  ]);
});

test('user bearer token never substitutes expert or admin tokens', async () => {
  setToken('user', 'user-token');
  setToken('expert', 'expert-token');
  setToken('admin', 'admin-token');
  const authorizations = [];
  globalThis.fetch = async (_url, options) => {
    authorizations.push(options.headers.Authorization);
    return jsonResponse({ status: true, data: { user: { id: 1 } } });
  };

  await userAuthService.me();
  await userAuthService.logout();
  assert.deepEqual(authorizations, ['Bearer user-token', 'Bearer user-token']);
});

test('verification-only user token keeps explicit purpose and scope metadata', () => {
  setToken('user', 'verify-token', 'Bearer', false, { purpose: 'email_verification', scope: 'verification_only' });
  const record = getTokenRecord('user');
  assert.equal(record.token, 'verify-token');
  assert.equal(record.purpose, 'email_verification');
  assert.equal(record.scope, 'verification_only');
  assert.equal(record.persistent, false);
});

test('signed email verification callback preserves expires and signature query exactly', async () => {
  const callback = resolveEmailVerificationCallback({
    id: '42',
    hash: 'abc123',
    searchParams: new URLSearchParams('?expires=1900000000&signature=deadbeef'),
    rawQuery: '?expires=1900000000&signature=deadbeef',
  });
  assert.equal(callback.isCallback, true);
  assert.equal(callback.request.rawQuery, '?expires=1900000000&signature=deadbeef');

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { email_verified: true } });
  };
  await userAuthService.verifyEmail(callback.request);
  assert.equal(captured.url, 'https://api.example.test/api/email/verify/42/abc123?expires=1900000000&signature=deadbeef');
  assert.equal(captured.options.headers.Authorization, undefined);
});

test('429 preserves structural error code and Retry-After for resend cooldown', async () => {
  setToken('user', 'verify-token');
  globalThis.fetch = async () => jsonResponse({ status: false, code: 'RATE_LIMITED', message: 'Too many requests.' }, 429, { 'Retry-After': '75' });

  await assert.rejects(() => userAuthService.sendVerification(), (error) => {
    assert.equal(error.status, 429);
    assert.equal(getBackendErrorCode(error), USER_AUTH_CODES.RATE_LIMITED);
    assert.equal(getRetryAfterSeconds(error), 75);
    return true;
  });
});

test('401 can revoke only the user session while 403 does not trigger revocation', async () => {
  setToken('user', 'user-token');
  setToken('expert', 'expert-token');
  setToken('admin', 'admin-token');
  setUnauthorizedHandler((accountType) => clearToken(accountType));

  globalThis.fetch = async () => jsonResponse({ status: false, code: 'UNAUTHENTICATED' }, 401);
  await assert.rejects(() => userAuthService.me(), (error) => error.status === 401);
  assert.equal(getTokenRecord('user'), null);
  assert.notEqual(getTokenRecord('expert'), null);
  assert.notEqual(getTokenRecord('admin'), null);

  setToken('user', 'user-token-2');
  globalThis.fetch = async () => jsonResponse({ status: false, message: 'Forbidden' }, 403);
  await assert.rejects(() => userAuthService.me(), (error) => error.status === 403);
  assert.equal(getTokenRecord('user')?.token, 'user-token-2');
});

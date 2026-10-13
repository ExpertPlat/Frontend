import test from 'node:test';
import assert from 'node:assert/strict';
import { expertAuthService } from '../../src/services/auth/expertAuthService.js';
import { clearToken, setToken } from '../../src/utils/tokenManager.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalBaseUrl = process.env.VITE_API_BASE_URL;
process.env.VITE_API_BASE_URL = 'https://api.example.test';

test.beforeEach(() => {
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
  setToken('user', 'user-token');
  setToken('admin', 'admin-token');
  setToken('expert', 'expert-token');
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearToken('user');
  clearToken('admin');
  clearToken('expert');
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});

function successResponse(data = {}) {
  return new Response(JSON.stringify({ status: true, data }), { status: 200 });
}

test('Expert protected auth endpoints send only the Expert bearer token', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return successResponse({ expert: {}, email_verified: true, kyc_status: 'not_submitted' });
  };

  await expertAuthService.me();
  await expertAuthService.changePassword({ current_password: 'old-password', password: 'new-password', password_confirmation: 'new-password' });
  await expertAuthService.logoutAll();
  await expertAuthService.sendVerification();

  assert.deepEqual(requests.map((item) => item.url), [
    'https://api.example.test/api/expert/auth/me',
    'https://api.example.test/api/expert/auth/password',
    'https://api.example.test/api/expert/auth/logout-all',
    'https://api.example.test/api/expert/auth/email/verification-notification',
  ]);
  for (const request of requests) assert.equal(request.options.headers.Authorization, 'Bearer expert-token');
});

test('Expert registration, login, forgot and reset remain public and never borrow User/Admin tokens', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return successResponse({ expert: {}, token: 'new-expert-token', token_type: 'Bearer' });
  };

  await expertAuthService.register({ email: 'expert@example.test' });
  await expertAuthService.login({ email: 'expert@example.test', password: 'secret' });
  await expertAuthService.forgotPassword({ email: 'expert@example.test' });
  await expertAuthService.resetPassword({ email: 'expert@example.test', token: 'reset', password: 'password', password_confirmation: 'password' });

  for (const request of requests) assert.equal(request.options.headers.Authorization, undefined);
});

test('Expert route does not fall back to User/Admin token when Expert token is absent', async () => {
  clearToken('expert');
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return successResponse({ expert: {}, email_verified: true, kyc_status: 'not_submitted' });
  };

  await expertAuthService.me();
  assert.equal(captured.url, 'https://api.example.test/api/expert/auth/me');
  assert.equal(captured.options.headers.Authorization, undefined);
});

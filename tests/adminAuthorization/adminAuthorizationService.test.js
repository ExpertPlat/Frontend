import test from 'node:test';
import assert from 'node:assert/strict';
import { setForbiddenHandler, setUnauthorizedHandler } from '../../src/api/client.js';
import { adminAuthorizationService } from '../../src/services/admin/adminAuthorizationService.js';
import { adminAuthService } from '../../src/services/auth/adminAuthService.js';
import { clearToken, setToken } from '../../src/utils/tokenManager.js';

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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalBaseUrl = process.env.VITE_API_BASE_URL;
process.env.VITE_API_BASE_URL = 'https://api.example.test';

test.beforeEach(() => {
  installBrowserStorage();
  setToken('admin', 'admin-token');
  setToken('user', 'user-token');
  setToken('expert', 'expert-token');
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearToken('admin');
  clearToken('user');
  clearToken('expert');
  setForbiddenHandler(null);
  setUnauthorizedHandler(null);
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});

test('protected Admin RBAC services use the admin bearer token and documented paths', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (String(url).includes('/admins?page=')) return jsonResponse({ data: [], meta: { current_page: 2, last_page: 2 } });
    return jsonResponse({ status: true, data: { roles: [], permissions: [] } });
  };

  await adminAuthorizationService.listRoles();
  await adminAuthorizationService.listPermissions();
  await adminAuthorizationService.listAdmins(2);
  await adminAuthorizationService.listUsers(3);
  await adminAuthorizationService.listExperts(4);

  assert.deepEqual(requests.map(({ url }) => new URL(url).pathname + new URL(url).search), [
    '/api/admin/roles',
    '/api/admin/permissions',
    '/api/admin/admins?page=2',
    '/api/admin/users?page=3',
    '/api/admin/experts?page=4',
  ]);
  for (const request of requests) {
    assert.equal(request.options.headers.Authorization, 'Bearer admin-token');
    assert.notEqual(request.options.headers.Authorization, 'Bearer user-token');
    assert.notEqual(request.options.headers.Authorization, 'Bearer expert-token');
  }
});

test('Sub-Admin create forwards role_id exactly and role assignment uses the documented endpoint', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return jsonResponse({ status: true, data: { admin: { id: 12, roles: ['support_admin'] } } }, 201);
  };

  await adminAuthorizationService.createAdmin({ name: 'Support', email: 'support@example.test', role_id: 3 });
  await adminAuthorizationService.assignRole(12, 3);

  assert.equal(requests[0].url, 'https://api.example.test/api/admin/admins');
  assert.deepEqual(JSON.parse(requests[0].options.body), { name: 'Support', email: 'support@example.test', role_id: 3 });
  assert.equal('roleId' in JSON.parse(requests[0].options.body), false);
  assert.equal(requests[1].url, 'https://api.example.test/api/admin/admins/12/roles/3');
  assert.equal(requests[1].options.method, 'POST');
});

test('Role update forwards only the server contract supplied by the caller', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { role: { id: 7, name: 'content_manager', permissions: ['users.viewAny'] } } });
  };

  await adminAuthorizationService.updateRole(7, { name: 'content_manager', permissions: ['users.viewAny'] });
  assert.equal(captured.url, 'https://api.example.test/api/admin/roles/7');
  assert.equal(captured.options.method, 'PUT');
  assert.deepEqual(JSON.parse(captured.options.body), { name: 'content_manager', permissions: ['users.viewAny'] });
  assert.equal('description' in JSON.parse(captured.options.body), false);
});


test('Admin login sends the documented device name and stays unauthenticated at request time', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { admin: { id: 1, roles: [], permissions: [] }, token: 'new-token', token_type: 'Bearer' } });
  };

  await adminAuthService.login({ email: 'admin@example.test', password: 'secret' });
  assert.equal(captured.url, 'https://api.example.test/api/admin/auth/login');
  assert.equal(captured.options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(captured.options.body), {
    device_name: 'Admin Dashboard',
    email: 'admin@example.test',
    password: 'secret',
  });
});

test('Admin invitation acceptance is public and never sends an existing admin token', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, message: 'accepted' });
  };

  await adminAuthService.acceptInvitation({
    email: 'support@example.test', token: 'token', password: 'SecurePassword1!', password_confirmation: 'SecurePassword1!',
  });

  assert.equal(captured.url, 'https://api.example.test/api/admin/auth/invitations/accept');
  assert.equal(captured.options.headers.Authorization, undefined);
});


test('Admin 401 can clear only the admin token through the registered unauthorized handler', async () => {
  setUnauthorizedHandler((accountType) => {
    if (accountType === 'admin') clearToken('admin');
  });
  globalThis.fetch = async () => jsonResponse({ status: false, message: 'Unauthenticated.' }, 401);

  await assert.rejects(() => adminAuthorizationService.listAdmins(1), (error) => error.status === 401);
  assert.equal(globalThis.window.sessionStorage.getItem('ecp-auth-admin'), null);
  assert.notEqual(globalThis.window.sessionStorage.getItem('ecp-auth-user'), null);
  assert.notEqual(globalThis.window.sessionStorage.getItem('ecp-auth-expert'), null);
});

test('Admin 403 refreshes authorization once without triggering the 401 logout handler', async () => {
  const forbidden = [];
  const unauthorized = [];
  setForbiddenHandler((request) => forbidden.push(request));
  setUnauthorizedHandler((accountType) => unauthorized.push(accountType));
  globalThis.fetch = async () => jsonResponse({ status: false, message: 'Forbidden.' }, 403);

  await assert.rejects(() => adminAuthorizationService.listRoles(), (error) => error.status === 403);
  assert.equal(forbidden.length, 1);
  assert.deepEqual(unauthorized, []);
  assert.equal(globalThis.window.sessionStorage.getItem('ecp-auth-admin') !== null, true);
});

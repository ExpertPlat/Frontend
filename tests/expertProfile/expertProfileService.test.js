import test from 'node:test';
import assert from 'node:assert/strict';
import { setToken, clearToken } from '../../src/utils/tokenManager.js';
import { expertProfileService } from '../../src/services/expert/expertProfileService.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalBaseUrl = process.env.VITE_API_BASE_URL;
process.env.VITE_API_BASE_URL = 'https://api.example.test';

test.beforeEach(() => {
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
  setToken('expert', 'expert-token');
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearToken('expert');
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});

test('profile workspace uses expert bearer token', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ status: true, data: {} }), { status: 200 });
  };
  await expertProfileService.getWorkspace();
  assert.equal(captured.url, 'https://api.example.test/api/expert/profile');
  assert.equal(captured.options.headers.Authorization, 'Bearer expert-token');
});

test('publish and availability use their exact contracts', async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ status: true, data: {} }), { status: 200 });
  };
  await expertProfileService.publish();
  await expertProfileService.updateAvailability({ timezone: 'UTC' });
  assert.equal(requests[0].url, 'https://api.example.test/api/expert/profile/publish');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[1].url, 'https://api.example.test/api/expert/availability');
  assert.equal(requests[1].options.method, 'PUT');
  assert.deepEqual(JSON.parse(requests[1].options.body), { timezone: 'UTC' });
});

test('public profile endpoint never sends the expert bearer token', async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ status: true, data: { expert: {} } }), { status: 200 });
  };
  await expertProfileService.getPublicProfile('ahmad ali');
  assert.equal(captured.url, 'https://api.example.test/api/experts/ahmad%20ali');
  assert.equal(captured.options.headers.Authorization, undefined);
});

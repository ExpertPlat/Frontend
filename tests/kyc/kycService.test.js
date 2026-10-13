import test from 'node:test';
import assert from 'node:assert/strict';
import { setUnauthorizedHandler } from '../../src/api/client.js';
import { setToken, clearToken } from '../../src/utils/tokenManager.js';
import { kycService } from '../../src/services/kyc/kycService.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

function installBrowserStorage() {
  globalThis.window = {
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
const originalBaseUrl = process.env.VITE_API_BASE_URL;

process.env.VITE_API_BASE_URL = 'https://api.example.test';

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (globalThis.window) {
    clearToken('expert');
    clearToken('admin');
  }
  setUnauthorizedHandler(null);
});

test.after(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalBaseUrl === undefined) delete process.env.VITE_API_BASE_URL;
  else process.env.VITE_API_BASE_URL = originalBaseUrl;
});

test('expert KYC uses only the expert bearer token and documented endpoint', async () => {
  installBrowserStorage();
  setToken('expert', 'expert-test-token');
  setToken('admin', 'admin-test-token');

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { kycStatus: 'draft' } });
  };

  await kycService.getExpertKyc();
  assert.equal(captured.url, 'https://api.example.test/api/expert/kyc');
  assert.equal(captured.options.headers.Authorization, 'Bearer expert-test-token');
  assert.notEqual(captured.options.headers.Authorization, 'Bearer admin-test-token');
});

test('admin list sends server-side search, filters, sorting and pagination with admin token', async () => {
  installBrowserStorage();
  setToken('expert', 'expert-test-token');
  setToken('admin', 'admin-test-token');

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { applications: [], pagination: { currentPage: 2, lastPage: 3, perPage: 20, total: 50 } } });
  };

  await kycService.getAdminKycApplications({
    search: 'Ahmad',
    status: 'under_review',
    dateFrom: '2026-09-01',
    dateTo: '2026-09-16',
    sortBy: 'updatedAt',
    sortDirection: 'asc',
    perPage: 20,
    page: 2,
  });

  const url = new URL(captured.url);
  assert.equal(url.pathname, '/api/admin/kyc/applications');
  assert.equal(url.searchParams.get('search'), 'Ahmad');
  assert.equal(url.searchParams.get('status'), 'under_review');
  assert.equal(url.searchParams.get('dateFrom'), '2026-09-01');
  assert.equal(url.searchParams.get('dateTo'), '2026-09-16');
  assert.equal(url.searchParams.get('sortBy'), 'updatedAt');
  assert.equal(url.searchParams.get('sortDirection'), 'asc');
  assert.equal(url.searchParams.get('perPage'), '20');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(captured.options.headers.Authorization, 'Bearer admin-test-token');
});

test('request-information sends structured requested changes with the admin token', async () => {
  installBrowserStorage();
  setToken('admin', 'admin-test-token');

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { application: { id: 5, status: 'needs_information' } } });
  };

  await kycService.requestAdminKycInformation(5, 'Identity evidence needs an update.', [{
    section: 'identity_scope',
    field: 'identityEvidence',
    documentId: 20,
    message: 'Upload a clearer image.',
  }]);

  assert.equal(captured.url, 'https://api.example.test/api/admin/kyc/applications/5/request-information');
  assert.equal(captured.options.headers.Authorization, 'Bearer admin-test-token');
  assert.deepEqual(JSON.parse(captured.options.body), {
    reason: 'Identity evidence needs an update.',
    requestedChanges: [{
      section: 'identity_scope',
      field: 'identityEvidence',
      documentId: 20,
      message: 'Upload a clearer image.',
    }],
  });
});

test('admin approval sends the verified scope contract', async () => {
  installBrowserStorage();
  setToken('admin', 'admin-test-token');
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ status: true, data: { application: { status: 'verified' } } });
  };
  const scopes = [{
    domain: 'legal', jurisdiction: 'Jordan', jurisdictionCountry: 'JO', role: 'Legal consultant',
    serviceTypes: ['written_consultation'], languages: ['ar'], validUntil: null,
    evidence: { type: 'credential', id: 123 },
    professionalReview: {
      verifiedCountry: 'JO',
      regulator: 'Relevant professional authority',
      registrationNumber: 'EXAMPLE-123',
      verificationSource: 'https://authority.example/registry/123',
      statusChecked: 'active',
      nextReviewAt: '2027-03-28',
    },
  }];
  await kycService.approveAdminKyc(8, scopes);
  assert.equal(captured.url, 'https://api.example.test/api/admin/kyc/applications/8/approve');
  assert.deepEqual(JSON.parse(captured.options.body), { scopes });
  assert.equal(captured.options.headers.Authorization, 'Bearer admin-test-token');
});

test('401 triggers the existing unauthorized flow while 403 preserves backend reason', async () => {
  installBrowserStorage();
  setToken('expert', 'expert-test-token');
  const unauthorized = [];
  setUnauthorizedHandler((accountType) => unauthorized.push(accountType));

  globalThis.fetch = async () => jsonResponse({ status: false, message: 'Unauthenticated.' }, 401);
  await assert.rejects(() => kycService.getExpertKyc(), (error) => {
    assert.equal(error.status, 401);
    assert.equal(error.payload.message, 'Unauthenticated.');
    return true;
  });
  assert.deepEqual(unauthorized, ['expert']);

  unauthorized.length = 0;
  globalThis.fetch = async () => jsonResponse({ status: false, message: 'Please verify your email address.' }, 403);
  await assert.rejects(() => kycService.getExpertKyc(), (error) => {
    assert.equal(error.status, 403);
    assert.equal(error.payload.message, 'Please verify your email address.');
    return true;
  });
  assert.deepEqual(unauthorized, []);
});

test('422 validation payload remains available to map nested form errors', async () => {
  installBrowserStorage();
  setToken('expert', 'expert-test-token');
  globalThis.fetch = async () => jsonResponse({
    status: false,
    message: 'The given data was invalid.',
    errors: {
      'experiences.0.jobTitle': ['The job title field is required.'],
      'qualifications.0.institution': ['The institution field is required.'],
    },
  }, 422);

  await assert.rejects(() => kycService.saveExpertKycDraft({ experiences: [{}] }), (error) => {
    assert.equal(error.status, 422);
    assert.equal(error.payload.errors['experiences.0.jobTitle'][0], 'The job title field is required.');
    assert.equal(error.payload.errors['qualifications.0.institution'][0], 'The institution field is required.');
    return true;
  });
});

test('protected downloadUrl is used with bearer only when it stays on the API origin', async () => {
  installBrowserStorage();
  setToken('expert', 'expert-test-token');

  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(new Blob(['test']), { status: 200, headers: { 'content-type': 'application/pdf' } });
  };

  const response = await kycService.downloadExpertKycDocument({
    id: 10,
    downloadUrl: 'https://api.example.test/api/expert/kyc/documents/10',
  });
  assert.equal(captured.url, 'https://api.example.test/api/expert/kyc/documents/10');
  assert.equal(captured.options.headers.Authorization, 'Bearer expert-test-token');
  assert.equal(response.data instanceof Blob, true);

  await assert.rejects(
    () => kycService.downloadExpertKycDocument({ id: 10, downloadUrl: 'https://untrusted.example/file/10' }),
    (error) => error.code === 'UNSAFE_API_URL',
  );
});

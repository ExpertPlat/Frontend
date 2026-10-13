import { request, unwrap } from '../http.js';

/**
 * Admin dashboard client. Every call carries the *admin* bearer token (realm "admin") and goes through `http.request`, so
 * Pages only use the groups at the bottom.
 */

const metaOf = (envelope) => {
  const m = envelope?.meta || envelope?.data?.meta || envelope?.data?.pagination || {};
  return {
    currentPage: Number(m.current_page ?? m.currentPage ?? 1),
    lastPage: Math.max(1, Number(m.last_page ?? m.lastPage ?? 1)),
    perPage: Number(m.per_page ?? m.perPage ?? 15),
    total: Number(m.total ?? 0),
  };
};

/** Laravel resource collections answer `{ data: [...], meta }`; a few historical endpoints wrap the list (`applications`, `roles`). */
export function normalizeList(envelope) {
  const data = envelope?.data;
  let items = [];
  if (Array.isArray(data)) items = data;
  else if (data && typeof data === 'object') items = data.applications || data.items || data.data || data.roles || [];
  const meta = metaOf(envelope);
  return { items, meta: { ...meta, total: meta.total || items.length } };
}

const call = (method, path, options) => request(method, path, { realm: 'admin', ...options });
const q = (path, query) => call('GET', path, { query });
const id = (value) => encodeURIComponent(value);

const list = (path) => (query) => q(path, query).then(normalizeList);
const one = (path) => (itemId, query) => q(`${path}/${id(itemId)}`, query).then(unwrap);

export const adminSession = Object.freeze({
  me: () => q('/api/admin/auth/me').then(unwrap),
});

export const adminDirectory = Object.freeze({
  users: list('/api/admin/users'),
  user: one('/api/admin/users'),
  userConsents: (userId) => q(`/api/admin/users/${id(userId)}/consents`).then(unwrap),
  experts: list('/api/admin/experts'),
  expert: one('/api/admin/experts'),
  admins: list('/api/admin/admins'),
  admin: one('/api/admin/admins'),
  createAdmin: (body) => call('POST', '/api/admin/admins', { body }).then(unwrap),
  updateAdmin: (adminId, body) => call('PATCH', `/api/admin/admins/${id(adminId)}`, { body }).then(unwrap),
  setAdminActive: (adminId, isActive) => call('PATCH', `/api/admin/admins/${id(adminId)}/status`, { body: { is_active: Boolean(isActive) } }).then(unwrap),
  resendInvitation: (adminId) => call('POST', `/api/admin/admins/${id(adminId)}/invitation`).then(unwrap),
  assignRole: (adminId, roleId) => call('POST', `/api/admin/admins/${id(adminId)}/roles/${id(roleId)}`).then(unwrap),
  revokeRole: (adminId, roleId) => call('DELETE', `/api/admin/admins/${id(adminId)}/roles/${id(roleId)}`).then(unwrap),
  roles: () => q('/api/admin/roles').then(unwrap).then((data) => data?.roles || []),
  role: (roleId) => q(`/api/admin/roles/${id(roleId)}`).then(unwrap).then((data) => data?.role || data),
  createRole: (body) => call('POST', '/api/admin/roles', { body }).then(unwrap).then((data) => data?.role || data),
  updateRole: (roleId, body) => call('PUT', `/api/admin/roles/${id(roleId)}`, { body }).then(unwrap).then((data) => data?.role || data),
  deleteRole: (roleId) => call('DELETE', `/api/admin/roles/${id(roleId)}`).then(unwrap),
  permissions: () => q('/api/admin/permissions').then(unwrap).then((data) => data?.permissions || []),
});

export const adminRenewals = Object.freeze({
  list: list('/api/admin/scope-renewals'),
  get: one('/api/admin/scope-renewals'),
  startReview: (renewalId, version) => call('POST', `/api/admin/scope-renewals/${id(renewalId)}/start-review`, { body: { version } }).then(unwrap),
  requestInformation: (renewalId, version, reason) => call('POST', `/api/admin/scope-renewals/${id(renewalId)}/request-information`, { body: { version, reason } }).then(unwrap),
  reject: (renewalId, version, reason) => call('POST', `/api/admin/scope-renewals/${id(renewalId)}/reject`, { body: { version, reason } }).then(unwrap),
  approve: (renewalId, version, extra = {}) => call('POST', `/api/admin/scope-renewals/${id(renewalId)}/approve`, { body: { version, ...extra } }).then(unwrap),
});

export const adminCatalog = Object.freeze({
  nodes: list('/api/admin/catalog/nodes'),
  createNode: (body) => call('POST', '/api/admin/catalog/nodes', { body }).then(unwrap),
  updateNode: (nodeId, body) => call('PATCH', `/api/admin/catalog/nodes/${id(nodeId)}`, { body }).then(unwrap),
  entries: list('/api/admin/catalog/entries'),
  entry: one('/api/admin/catalog/entries'),
  createEntry: (body) => call('POST', '/api/admin/catalog/entries', { body }).then(unwrap),
  createVersion: (entryId, body) => call('POST', `/api/admin/catalog/entries/${id(entryId)}/versions`, { body }).then(unwrap),
  impact: (versionId) => q(`/api/admin/catalog/versions/${id(versionId)}/impact`).then(unwrap),
  review: (versionId, body) => call('POST', `/api/admin/catalog/versions/${id(versionId)}/review`, { body }).then(unwrap),
  publish: (versionId, body) => call('POST', `/api/admin/catalog/versions/${id(versionId)}/publish`, { body }).then(unwrap),
  pause: (versionId, body) => call('POST', `/api/admin/catalog/versions/${id(versionId)}/pause`, { body }).then(unwrap),
  grants: list('/api/admin/catalog/grants'),
  createGrant: (body) => call('POST', '/api/admin/catalog/grants', { body }).then(unwrap),
  revokeGrant: (grantId, reasonCode) => call('POST', `/api/admin/catalog/grants/${id(grantId)}/revoke`, { body: { reasonCode } }).then(unwrap),
  waitingCases: list('/api/admin/catalog/waiting-cases'),
});

export const adminOversight = Object.freeze({
  cases: list('/api/v2/admin/cases'),
  case: one('/api/v2/admin/cases'),
  dataRequests: list('/api/admin/data-requests'),
  dataRequest: one('/api/admin/data-requests'),
  reviews: list('/api/admin/expert-reviews'),
  moderateReview: (reviewId, body) => call('POST', `/api/admin/expert-reviews/${id(reviewId)}/moderation`, { body }).then(unwrap),
});

export const adminFinance = Object.freeze({
  fundings: list('/api/admin/finance/fundings'),
  funding: one('/api/admin/finance/fundings'),
  createRefund: (fundingId, body) => call('POST', `/api/admin/finance/fundings/${id(fundingId)}/refunds`, { body }).then(unwrap),
  reconcile: (fundingId) => call('POST', `/api/admin/finance/fundings/${id(fundingId)}/reconcile`).then(unwrap),
  ledger: list('/api/admin/finance/ledger'),
  refunds: list('/api/admin/finance/refunds'),
  decideRefund: (refundId, body) => call('POST', `/api/admin/finance/refunds/${id(refundId)}/decision`, { body }).then(unwrap),
  reconciliation: list('/api/admin/finance/reconciliation'),
  disputes: list('/api/admin/finance/disputes'),
  stripeAccounts: list('/api/admin/finance/stripe-accounts'),
});

/** KYC list/detail/actions already live in services/kyc/kycService.js (shared with the Expert side) and are reused as they are. */

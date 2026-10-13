export const ADMIN_PERMISSIONS = Object.freeze({
  ADMINS_VIEW_ANY: 'admins.viewAny',
  ADMINS_VIEW: 'admins.view',
  ADMINS_CREATE: 'admins.create',
  ADMINS_UPDATE: 'admins.update',
  ADMINS_ASSIGN_ROLES: 'admins.assignRoles',

  ROLES_VIEW_ANY: 'roles.viewAny',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  PERMISSIONS_VIEW_ANY: 'permissions.viewAny',

  USERS_VIEW_ANY: 'users.viewAny',
  USERS_VIEW: 'users.view',
  USERS_UPDATE: 'users.update',
  USERS_CONSENT_METADATA_VIEW: 'users.consentMetadata.view',

  DATA_REQUESTS_VIEW_ANY: 'dataRequests.viewAny',
  DATA_REQUESTS_VIEW: 'dataRequests.view',

  EXPERTS_VIEW_ANY: 'experts.viewAny',
  EXPERTS_VIEW: 'experts.view',
  EXPERTS_UPDATE: 'experts.update',
  EXPERTS_REVIEW_KYC: 'experts.reviewKyc',

  EXPERT_RENEWALS_VIEW_ANY: 'expertRenewals.viewAny',
  EXPERT_RENEWALS_VIEW: 'expertRenewals.view',
  EXPERT_RENEWALS_VIEW_EVIDENCE: 'expertRenewals.viewEvidence',
  EXPERT_RENEWALS_REVIEW: 'expertRenewals.review',

  CATALOG_VIEW: 'catalog.view',
  CATALOG_MANAGE_DRAFTS: 'catalog.manageDrafts',
  CATALOG_REVIEW: 'catalog.review',
  CATALOG_PUBLISH: 'catalog.publish',
  CATALOG_PAUSE: 'catalog.pause',
  CATALOG_VIEW_IMPACT: 'catalog.viewImpact',

  CASES_VIEW_ANY: 'cases.viewAny',
  CASES_VIEW: 'cases.view',

  FINANCE_VIEW: 'finance.view',
  FINANCE_RECONCILE: 'finance.reconcile',

  REFUNDS_VIEW: 'refunds.view',
  REFUNDS_APPROVE: 'refunds.approve',

  DISPUTES_VIEW: 'disputes.view',

  STRIPE_ACCOUNTS_VIEW: 'stripe_accounts.view',

  REVIEWS_VIEW_ANY: 'reviews.viewAny',
  REVIEWS_MODERATE: 'reviews.moderate',

  SUPPORT_VIEW_ANY: 'support.viewAny',
  SUPPORT_VIEW: 'support.view',
  SUPPORT_UPDATE: 'support.update',
});

export const ADMIN_PERMISSION_VALUES = Object.freeze(Object.values(ADMIN_PERMISSIONS));

export function isSuperAdmin(admin) {
  return Array.isArray(admin?.roles) && admin.roles.includes('super_admin');
}

export function hasPermission(admin, permission) {
  if (!admin || !permission) return false;
  if (isSuperAdmin(admin)) return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
}

export function hasAnyPermission(admin, permissions = []) {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;
  return permissions.some((permission) => hasPermission(admin, permission));
}

export function hasAllPermissions(admin, permissions = []) {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;
  return permissions.every((permission) => hasPermission(admin, permission));
}

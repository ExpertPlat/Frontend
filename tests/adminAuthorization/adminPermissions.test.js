import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isSuperAdmin,
} from '../../src/features/adminAuthorization/adminPermissions.js';

const userManager = {
  roles: ['user_manager'],
  permissions: [
    'admins.viewAny', 'admins.view', 'users.viewAny', 'users.view', 'users.update', 'experts.viewAny', 'experts.view',
  ],
};
const supportAdmin = {
  roles: ['support_admin'],
  permissions: ['users.viewAny', 'users.view', 'experts.viewAny', 'experts.view', 'support.viewAny', 'support.view', 'support.update'],
};
const kycReviewer = {
  roles: ['kyc_reviewer'],
  permissions: ['experts.viewAny', 'experts.view', 'experts.reviewKyc'],
};

test('super_admin bypasses the local permission list', () => {
  const admin = { roles: ['super_admin'], permissions: [] };
  assert.equal(isSuperAdmin(admin), true);
  assert.equal(hasPermission(admin, ADMIN_PERMISSIONS.ROLES_DELETE), true);
  assert.equal(hasAllPermissions(admin, Object.values(ADMIN_PERMISSIONS)), true);
});

test('role names other than super_admin do not grant permissions by themselves', () => {
  const admin = { roles: ['user_manager'], permissions: [] };
  assert.equal(hasPermission(admin, ADMIN_PERMISSIONS.USERS_VIEW_ANY), false);
});

test('user_manager access follows its permission array', () => {
  assert.equal(hasPermission(userManager, ADMIN_PERMISSIONS.USERS_VIEW_ANY), true);
  assert.equal(hasPermission(userManager, ADMIN_PERMISSIONS.EXPERTS_VIEW_ANY), true);
  assert.equal(hasPermission(userManager, ADMIN_PERMISSIONS.ADMINS_VIEW_ANY), true);
  assert.equal(hasPermission(userManager, ADMIN_PERMISSIONS.EXPERTS_REVIEW_KYC), false);
  assert.equal(hasPermission(userManager, ADMIN_PERMISSIONS.ROLES_VIEW_ANY), false);
});

test('support_admin has supported read permissions but not KYC or Roles', () => {
  assert.equal(hasAnyPermission(supportAdmin, [ADMIN_PERMISSIONS.USERS_VIEW_ANY, ADMIN_PERMISSIONS.EXPERTS_REVIEW_KYC]), true);
  assert.equal(hasPermission(supportAdmin, ADMIN_PERMISSIONS.EXPERTS_REVIEW_KYC), false);
  assert.equal(hasPermission(supportAdmin, ADMIN_PERMISSIONS.ROLES_VIEW_ANY), false);
});

test('kyc_reviewer can review KYC but cannot manage admins or roles', () => {
  assert.equal(hasAllPermissions(kycReviewer, [ADMIN_PERMISSIONS.EXPERTS_VIEW_ANY, ADMIN_PERMISSIONS.EXPERTS_REVIEW_KYC]), true);
  assert.equal(hasPermission(kycReviewer, ADMIN_PERMISSIONS.ADMINS_VIEW_ANY), false);
  assert.equal(hasPermission(kycReviewer, ADMIN_PERMISSIONS.ROLES_VIEW_ANY), false);
});

test('custom role permissions are evaluated independently from role name', () => {
  const custom = { roles: ['content_manager'], permissions: ['roles.viewAny', 'roles.create', 'permissions.viewAny'] };
  assert.equal(hasAllPermissions(custom, [ADMIN_PERMISSIONS.ROLES_CREATE, ADMIN_PERMISSIONS.PERMISSIONS_VIEW_ANY]), true);
  assert.equal(hasPermission(custom, ADMIN_PERMISSIONS.ROLES_DELETE), false);
});

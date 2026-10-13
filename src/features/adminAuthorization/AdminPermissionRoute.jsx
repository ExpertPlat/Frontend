import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminForbidden from '../adminDashboard/ui/AdminForbidden';
import useAdminAuthorization from './useAdminAuthorization';

/** Route guard: shows the "no access" screen (never a blank page) when the admin lacks the permission. */
export default function AdminPermissionRoute({ permission, anyOf, allOf }) {
  const { session, can, canAny, canAll } = useAdminAuthorization();
  if (session.isLoading) return null;
  let allowed = true;
  if (permission) allowed = can(permission);
  else if (Array.isArray(anyOf)) allowed = canAny(anyOf);
  else if (Array.isArray(allOf)) allowed = canAll(allOf);
  return allowed ? <Outlet /> : <AdminForbidden />;
}

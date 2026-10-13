import { useAdminSession } from '../adminDashboard/session/AdminSessionContext';

/** Thin alias kept for existing imports: permissions now come from the admin session loaded from GET /api/admin/auth/me. */
export default function useAdminAuthorization() {
  const { admin, loading, can, canAny, canAll, isSuper } = useAdminSession();
  return { admin, session: { isLoading: loading, isAuthenticated: Boolean(admin) }, isSuperAdmin: isSuper, can, canAny, canAll };
}

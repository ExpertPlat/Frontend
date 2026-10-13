import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminSession } from '../../../services/admin/adminApi';
import { hasAllPermissions, hasAnyPermission, hasPermission, isSuperAdmin } from '../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import { loadQueues } from '../data/queues';

const AdminSessionContext = createContext(null);

/**
 * The signed-in administrator and their permissions, loaded from GET /api/admin/auth/me. The sidebar, the topbar,
 * the route guards and the action buttons all read from here, so a permission is checked in one place only.
 */
export function AdminSessionProvider({ children }) {
  const { language } = useUserI18n();
  const [state, setState] = useState({ admin: null, loading: true, error: null });
  const [queues, setQueues] = useState({});

  const load = useCallback(async () => {
    try {
      const data = await adminSession.me();
      setState({ admin: data?.admin || data, loading: false, error: null });
    } catch (error) {
      setState({ admin: null, loading: false, error });
    }
  }, []);
  useEffect(() => { load(); }, [load, language]);

  const admin = state.admin;
  const refreshQueues = useCallback(async () => {
    if (!admin) return;
    setQueues(await loadQueues((permission) => hasPermission(admin, permission)));
  }, [admin]);
  useEffect(() => {
    refreshQueues();
    const timer = window.setInterval(refreshQueues, 60000);
    return () => window.clearInterval(timer);
  }, [refreshQueues]);

  const value = useMemo(() => {
    return {
      admin,
      loading: state.loading,
      error: state.error,
      reload: load,
      queues,
      refreshQueues,
      isSuper: isSuperAdmin(admin),
      can: (permission) => hasPermission(admin, permission),
      canAny: (list) => hasAnyPermission(admin, list),
      canAll: (list) => hasAllPermissions(admin, list),
    };
  }, [state, admin, load, queues, refreshQueues]);
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error('useAdminSession must be used inside AdminSessionProvider');
  return context;
}

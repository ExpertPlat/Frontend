import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { demoLoginPath } from './demoConfig';

/**
 * Switch to another demo account: signs out the target role first (so the login page is not skipped by the
 * "already signed in" redirect), then opens that role's login with the account pre-selected.
 */
export default function useDemoSwitch() {
  const { sessions, logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(async (role, email) => {
    try {
      if (sessions?.[role]?.isAuthenticated) await logout(role);
    } catch { /* the local session is cleared even if the server call fails */ }
    navigate(demoLoginPath(role, email));
  }, [sessions, logout, navigate]);
}

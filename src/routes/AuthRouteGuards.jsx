import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function verificationTarget(path, email = '') {
  if (!path) return '';
  if (!email) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}email=${encodeURIComponent(email)}`;
}

export function ProtectedRoute({ accountType, loginPath, verificationPath = '' }) {
  const { sessions } = useAuth();
  const location = useLocation();
  const session = sessions[accountType];

  if (!session || session.isLoading) return null;
  if (!session.isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Expert tokens are intentionally issued before email verification. Keep that
  // limited session for resend/me, but never expose the verified expert workspace.
  if (accountType === 'expert' && session.emailVerified === false && verificationPath) {
    return (
      <Navigate
        to={verificationTarget(verificationPath, session.account?.email)}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export function GuestRoute({ accountType, redirectTo, verificationPath = '' }) {
  const { sessions } = useAuth();
  const session = sessions[accountType];

  if (!session || session.isLoading) return null;
  if (session.isAuthenticated) {
    if (accountType === 'expert' && session.emailVerified === false && verificationPath) {
      return <Navigate to={verificationTarget(verificationPath, session.account?.email)} replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
}

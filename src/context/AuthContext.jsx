import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setForbiddenHandler, setUnauthorizedHandler } from '../api/client';
import { ApiError } from '../api/errorHandler';
import { getBackendErrorCode, USER_AUTH_CODES } from '../features/auth/utils/userAuthErrors';
import { getUserVerificationState, isFullUserAccess } from '../features/auth/utils/userSessionPolicy';
import { adminAuthService } from '../services/auth/adminAuthService';
import { expertAuthService } from '../services/auth/expertAuthService';
import { userAuthService } from '../services/auth/userAuthService';
import { clearToken, getTokenRecord, setToken } from '../utils/tokenManager';

export const AuthContext = createContext(null);

const createSession = () => ({
  account: null,
  isAuthenticated: false,
  isLoading: true,
  tokenType: null,
  emailVerified: null,
  kycStatus: null,
  restoreError: null,
  lastRestoredAt: 0,
});

const INITIAL_SESSIONS = Object.freeze({
  user: createSession(),
  expert: createSession(),
  admin: createSession(),
});

function requireData(payload, accountKey, requiresToken = false) {
  if (!payload || payload.status === false || !payload.data || typeof payload.data !== 'object') {
    throw new ApiError(payload?.message || 'Unexpected authentication response.', {
      status: 200,
      payload,
      code: 'CONTRACT_ERROR',
    });
  }

  if (!payload.data[accountKey]) {
    throw new ApiError('Authentication response is missing account data.', {
      status: 200,
      payload,
      code: 'CONTRACT_ERROR',
    });
  }

  if (requiresToken && !payload.data.token) {
    throw new ApiError('Authentication response is missing the bearer token.', {
      status: 200,
      payload,
      code: 'CONTRACT_ERROR',
    });
  }

  return payload.data;
}


function storeUserToken(data, remember, purpose) {
  if (!data?.token) return false;
  setToken('user', data.token, data.token_type || 'Bearer', remember, {
    scope: data.token_scope || null,
    purpose,
  });
  return true;
}

export function AuthProvider({ children }) {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const adminRefreshInFlightRef = useRef(null);

  const updateSession = useCallback((accountType, patch) => {
    setSessions((current) => ({
      ...current,
      [accountType]: { ...current[accountType], ...patch },
    }));
  }, []);

  const clearSession = useCallback((accountType) => {
    clearToken(accountType);
    updateSession(accountType, {
      account: null,
      isAuthenticated: false,
      tokenType: null,
      emailVerified: null,
      kycStatus: null,
      restoreError: null,
      lastRestoredAt: 0,
      isLoading: false,
    });
  }, [updateSession]);

  useEffect(() => setUnauthorizedHandler((accountType) => {
    if (accountType === 'user' || accountType === 'expert' || accountType === 'admin') {
      clearSession(accountType);
    }
  }), [clearSession]);

  const refreshAdminAuthorization = useCallback(async () => {
    if (!getTokenRecord('admin')) return null;
    if (adminRefreshInFlightRef.current) return adminRefreshInFlightRef.current;

    const request = (async () => {
      const payload = await adminAuthService.me();
      const data = requireData(payload, 'admin');
      updateSession('admin', {
        account: data.admin,
        isAuthenticated: true,
        isLoading: false,
        tokenType: data.token_type || getTokenRecord('admin')?.tokenType || 'Bearer',
        restoreError: null,
        lastRestoredAt: Date.now(),
      });
      return data.admin;
    })();

    adminRefreshInFlightRef.current = request;
    try {
      return await request;
    } finally {
      if (adminRefreshInFlightRef.current === request) adminRefreshInFlightRef.current = null;
    }
  }, [updateSession]);

  useEffect(() => setForbiddenHandler(() => refreshAdminAuthorization()), [refreshAdminAuthorization]);

  const restoreSession = useCallback(async (accountType) => {
    const tokenRecord = getTokenRecord(accountType);
    if (!tokenRecord) {
      updateSession(accountType, { isLoading: false, restoreError: null });
      return;
    }

    updateSession(accountType, { isLoading: true, restoreError: null, tokenType: tokenRecord.tokenType });

    try {
      if (accountType === 'user') {
        if (tokenRecord.purpose === 'email_verification' || (tokenRecord.scope && tokenRecord.scope !== 'full_access')) {
          updateSession('user', {
            account: null,
            isAuthenticated: false,
            isLoading: false,
            tokenType: tokenRecord.tokenType,
            emailVerified: false,
            restoreError: null,
          });
          return;
        }

        const payload = await userAuthService.me();
        const data = requireData(payload, 'user');
        const verified = getUserVerificationState(data);
        if (verified === false) {
          clearToken('user');
          updateSession('user', {
            account: data.user,
            isAuthenticated: false,
            isLoading: false,
            tokenType: null,
            emailVerified: false,
            restoreError: null,
          });
          return;
        }
        updateSession('user', {
          account: data.user,
          isAuthenticated: true,
          isLoading: false,
          tokenType: tokenRecord.tokenType,
          emailVerified: verified ?? true,
          restoreError: null,
        });
        return;
      }

      if (accountType === 'expert') {
        const payload = await expertAuthService.me();
        const data = requireData(payload, 'expert');
        updateSession('expert', {
          account: data.expert,
          isAuthenticated: true,
          isLoading: false,
          tokenType: tokenRecord.tokenType,
          emailVerified: data.email_verified,
          kycStatus: data.kyc_status,
          restoreError: null,
        });
        return;
      }

      const payload = await adminAuthService.me();
      const data = requireData(payload, 'admin');
      updateSession('admin', {
        account: data.admin,
        isAuthenticated: true,
        isLoading: false,
        tokenType: tokenRecord.tokenType,
        restoreError: null,
        lastRestoredAt: Date.now(),
      });
    } catch (error) {
      if (error?.status === 401) {
        clearToken(accountType);
      }

      if (accountType === 'admin' && error?.status === 403) {
        setSessions((current) => ({
          ...current,
          admin: {
            ...current.admin,
            isAuthenticated: Boolean(current.admin.account),
            isLoading: false,
            restoreError: error,
            lastRestoredAt: Date.now(),
          },
        }));
        return;
      }

      // /expert/auth/me does not require verified email. A 403 here therefore
      // means the stored token is not a usable Expert session (wrong account
      // type/ability or an inactive account). Do not leave that token around.
      if (accountType === 'expert' && error?.status === 403) {
        clearToken('expert');
      }

      updateSession(accountType, {
        account: null,
        isAuthenticated: false,
        isLoading: false,
        restoreError: error,
      });
    }
  }, [updateSession]);

  useEffect(() => {
    restoreSession('user');
    restoreSession('expert');
    restoreSession('admin');
  }, [restoreSession]);

  useEffect(() => {
    const refreshWhenStale = () => {
      const adminSession = sessions.admin;
      const stale = Date.now() - Number(adminSession?.lastRestoredAt || 0) >= 60000;
      if (!adminSession?.isAuthenticated || adminSession?.isLoading || !stale) return;
      refreshAdminAuthorization().catch(() => {});
    };

    window.addEventListener('focus', refreshWhenStale);
    return () => window.removeEventListener('focus', refreshWhenStale);
  }, [refreshAdminAuthorization, sessions.admin]);

  const registerUser = useCallback(async (formData, remember = false) => {
    const payload = await userAuthService.register(formData);
    const data = requireData(payload, 'user');
    const verified = getUserVerificationState(data) === true;
    const fullAccess = verified && data.token_scope === 'full_access';

    if (data.token) {
      storeUserToken(data, remember, fullAccess ? 'session' : 'email_verification');
    } else {
      clearToken('user');
    }

    updateSession('user', {
      account: data.user,
      isAuthenticated: fullAccess,
      isLoading: false,
      tokenType: data.token ? (data.token_type || 'Bearer') : null,
      emailVerified: verified,
      restoreError: null,
    });
    return payload;
  }, [updateSession]);

  const loginUser = useCallback(async (credentials, remember = false) => {
    try {
      const payload = await userAuthService.login(credentials);
      const data = requireData(payload, 'user', true);

      if (!isFullUserAccess(data)) {
        storeUserToken(data, remember, 'email_verification');
        updateSession('user', {
          account: data.user,
          isAuthenticated: false,
          isLoading: false,
          tokenType: data.token_type || 'Bearer',
          emailVerified: false,
          restoreError: null,
        });
        throw new ApiError(payload?.message || 'Email verification is required.', {
          status: 403,
          payload: { ...payload, code: USER_AUTH_CODES.EMAIL_NOT_VERIFIED },
          code: USER_AUTH_CODES.EMAIL_NOT_VERIFIED,
        });
      }

      storeUserToken(data, remember, 'session');
      updateSession('user', {
        account: data.user,
        isAuthenticated: true,
        isLoading: false,
        tokenType: data.token_type || 'Bearer',
        emailVerified: getUserVerificationState(data) ?? true,
        restoreError: null,
      });
      return payload;
    } catch (error) {
      const payload = error?.payload;
      const data = payload?.data;

      if (getBackendErrorCode(error) === USER_AUTH_CODES.EMAIL_NOT_VERIFIED) {
        if (data?.user && data?.token) {
          storeUserToken(data, remember, 'email_verification');
          updateSession('user', {
            account: data.user,
            isAuthenticated: false,
            isLoading: false,
            tokenType: data.token_type || 'Bearer',
            emailVerified: false,
            restoreError: null,
          });
        } else {
          clearToken('user');
          updateSession('user', {
            account: data?.user || null,
            isAuthenticated: false,
            isLoading: false,
            tokenType: null,
            emailVerified: false,
            restoreError: null,
          });
        }
      }

      throw error;
    }
  }, [updateSession]);

  const registerExpert = useCallback(async (formData, remember = false) => {
    const payload = await expertAuthService.register(formData);
    const data = requireData(payload, 'expert', true);
    setToken('expert', data.token, data.token_type, remember);
    updateSession('expert', {
      account: data.expert,
      isAuthenticated: true,
      isLoading: false,
      tokenType: data.token_type,
      emailVerified: data.email_verified,
      kycStatus: data.kyc_status,
      restoreError: null,
    });
    return payload;
  }, [updateSession]);

  const loginExpert = useCallback(async (credentials, remember = false) => {
    const payload = await expertAuthService.login(credentials);
    const data = requireData(payload, 'expert', true);
    setToken('expert', data.token, data.token_type, remember);
    updateSession('expert', {
      account: data.expert,
      isAuthenticated: true,
      isLoading: false,
      tokenType: data.token_type,
      emailVerified: data.email_verified,
      kycStatus: data.kyc_status,
      restoreError: null,
    });
    return payload;
  }, [updateSession]);

  const loginAdmin = useCallback(async (credentials, remember = false) => {
    const payload = await adminAuthService.login(credentials);
    const data = requireData(payload, 'admin', true);
    setToken('admin', data.token, data.token_type, remember);
    updateSession('admin', {
      account: data.admin,
      isAuthenticated: true,
      isLoading: false,
      tokenType: data.token_type,
      restoreError: null,
      lastRestoredAt: Date.now(),
    });
    return payload;
  }, [updateSession]);

  const logout = useCallback(async (accountType, allDevices = false) => {
    const services = {
      user: userAuthService,
      expert: expertAuthService,
      admin: adminAuthService,
    };
    const service = services[accountType];
    if (!service) throw new Error(`Unsupported account type: ${accountType}`);

    try {
      return await (allDevices ? service.logoutAll() : service.logout());
    } finally {
      clearSession(accountType);
    }
  }, [clearSession]);


  const logoutAll = useCallback((accountType) => logout(accountType, true), [logout]);

  const changeExpertPassword = useCallback((data) => expertAuthService.changePassword(data), []);

  const resetUserPassword = useCallback(async (data) => {
    const payload = await userAuthService.resetPassword(data);
    clearSession('user');
    return payload;
  }, [clearSession]);

  const resetExpertPassword = useCallback(async (data) => {
    const payload = await expertAuthService.resetPassword(data);
    clearSession('expert');
    return payload;
  }, [clearSession]);

  const resendUserVerification = useCallback(async () => {
    const payload = await userAuthService.sendVerification();
    if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, 'email_verified')) {
      updateSession('user', { emailVerified: payload.data.email_verified });
    }
    return payload;
  }, [updateSession]);

  const verifyUserEmail = useCallback(async ({ id, hash, rawQuery, verificationUrl }) => {
    const payload = await userAuthService.verifyEmail({ id, hash, rawQuery, verificationUrl });
    clearSession('user');
    return payload;
  }, [clearSession]);

  const resendExpertVerification = useCallback(async () => {
    const payload = await expertAuthService.sendVerification();
    if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, 'email_verified')) {
      updateSession('expert', { emailVerified: payload.data.email_verified });
    }
    return payload;
  }, [updateSession]);

  const verifyExpertEmail = useCallback(async ({ id, hash, rawQuery, verificationUrl }) => {
    const payload = await expertAuthService.verifyEmail({ id, hash, rawQuery, verificationUrl });
    if (payload?.data && Object.prototype.hasOwnProperty.call(payload.data, 'email_verified')) {
      updateSession('expert', { emailVerified: payload.data.email_verified });
    }
    return payload;
  }, [updateSession]);

  const value = useMemo(() => ({
    sessions,
    registerUser,
    loginUser,
    registerExpert,
    loginExpert,
    loginAdmin,
    logout,
    logoutAll,
    restoreSession,
    refreshAdminAuthorization,
    clearSession,
    resetUserPassword,
    resetExpertPassword,
    resendUserVerification,
    resendExpertVerification,
    verifyUserEmail,
    verifyExpertEmail,
    forgotUserPassword: userAuthService.forgotPassword,
    forgotExpertPassword: expertAuthService.forgotPassword,
    changeExpertPassword,
  }), [
    sessions,
    registerUser,
    loginUser,
    registerExpert,
    loginExpert,
    loginAdmin,
    logout,
    logoutAll,
    restoreSession,
    refreshAdminAuthorization,
    clearSession,
    resetUserPassword,
    resetExpertPassword,
    resendUserVerification,
    resendExpertVerification,
    verifyUserEmail,
    verifyExpertEmail,
    changeExpertPassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

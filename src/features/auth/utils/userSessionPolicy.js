export function getUserVerificationState(data) {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.email_verified === 'boolean') return data.email_verified;
  if (typeof data.user?.email_verified === 'boolean') return data.user.email_verified;
  if (data.user && Object.prototype.hasOwnProperty.call(data.user, 'email_verified_at')) {
    return Boolean(data.user.email_verified_at);
  }
  return null;
}

export function isFullUserAccess(data, { requireExplicitFullScope = false } = {}) {
  const verified = getUserVerificationState(data);
  if (verified === false) return false;
  if (requireExplicitFullScope && data?.token_scope !== 'full_access') return false;
  if (data?.token_scope && data.token_scope !== 'full_access') return false;
  return true;
}

export function getUserTokenPurpose(data, options = {}) {
  return isFullUserAccess(data, options) ? 'session' : 'email_verification';
}

export const USER_AUTH_CODES = Object.freeze({
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_UNAVAILABLE: 'ACCOUNT_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  VERIFICATION_INVALID: 'VERIFICATION_INVALID',
  VERIFICATION_EXPIRED: 'VERIFICATION_EXPIRED',
  ALREADY_VERIFIED: 'ALREADY_VERIFIED',
  RESET_TOKEN_INVALID: 'RESET_TOKEN_INVALID',
  RESET_TOKEN_EXPIRED: 'RESET_TOKEN_EXPIRED',
});

const STATUS_FALLBACKS = Object.freeze({
  401: USER_AUTH_CODES.UNAUTHENTICATED,
  422: USER_AUTH_CODES.VALIDATION_ERROR,
  429: USER_AUTH_CODES.RATE_LIMITED,
});

export function getBackendErrorCode(error) {
  const raw = error?.payload?.code ?? error?.payload?.error_code ?? error?.payload?.error?.code ?? null;
  if (typeof raw === 'string' && raw.trim()) return raw.trim().toUpperCase();
  return STATUS_FALLBACKS[error?.status] || null;
}

export function isBackendErrorCode(error, ...codes) {
  const actual = getBackendErrorCode(error);
  return Boolean(actual && codes.some((code) => String(code || '').toUpperCase() === actual));
}

export function getRetryAfterSeconds(error, fallbackSeconds = 60) {
  const payloadValue = error?.payload?.retry_after ?? error?.payload?.retryAfter ?? error?.retryAfter;
  const numeric = Number(payloadValue);
  if (Number.isFinite(numeric) && numeric > 0) return Math.ceil(numeric);
  return fallbackSeconds;
}

export function getUserLoginErrorMessage(error, tr) {
  const code = getBackendErrorCode(error);
  const messages = {
    [USER_AUTH_CODES.INVALID_CREDENTIALS]: tr('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'The email or password is incorrect.'),
    [USER_AUTH_CODES.ACCOUNT_UNAVAILABLE]: tr('هذا الحساب غير متاح حاليًا. تواصل مع الدعم إذا كنت تعتقد أن ذلك خطأ.', 'This account is currently unavailable. Contact support if you believe this is a mistake.'),
    [USER_AUTH_CODES.RATE_LIMITED]: tr('تمت محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.', 'Too many attempts were made. Wait a moment and try again.'),
    [USER_AUTH_CODES.UNAUTHENTICATED]: tr('تعذر تسجيل الدخول بهذه البيانات.', 'Could not sign in with these credentials.'),
    [USER_AUTH_CODES.VALIDATION_ERROR]: tr('راجع بيانات تسجيل الدخول وحاول مرة أخرى.', 'Check your sign-in details and try again.'),
  };
  return messages[code] || '';
}

export function getVerificationFailureState(error) {
  const code = getBackendErrorCode(error);
  if (code === USER_AUTH_CODES.ALREADY_VERIFIED) return 'already_verified';
  if (code === USER_AUTH_CODES.VERIFICATION_EXPIRED) return 'expired';
  if (code === USER_AUTH_CODES.VERIFICATION_INVALID) return 'invalid';
  if (error?.status === 410) return 'expired';
  return 'invalid_or_expired';
}

export function getResetFailureState(error) {
  const code = getBackendErrorCode(error);
  if (code === USER_AUTH_CODES.RESET_TOKEN_EXPIRED) return 'expired';
  if (code === USER_AUTH_CODES.RESET_TOKEN_INVALID) return 'invalid';
  return null;
}

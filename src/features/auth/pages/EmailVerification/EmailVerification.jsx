import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import AuthApiAlert from '../../components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import { getErrorMessage } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { PATHS } from '../../../../routes/paths';
import AuthSuccessAlert from '../../components/AuthSuccessAlert/AuthSuccessAlert';
import { useLocale } from '../../../../context/LocaleContext';
import { hasToken } from '../../../../utils/tokenManager';
import { resolveEmailVerificationCallback } from '../../utils/emailVerificationCallback';
import {
  getBackendErrorCode,
  getRetryAfterSeconds,
  getVerificationFailureState,
  USER_AUTH_CODES,
} from '../../utils/userAuthErrors';

const DEFAULT_RESEND_COOLDOWN = 60;

export default function EmailVerification() {
  const { id, hash } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendUserVerification, verifyUserEmail, sessions, clearSession } = useAuth();
  const { locale, tr } = useLocale();
  const email = location.state?.email || searchParams.get('email') || tr('بريدك الإلكتروني', 'your email');
  const { isCallback, request: verificationRequest } = useMemo(
    () => resolveEmailVerificationCallback({
      id,
      hash,
      searchParams: new URLSearchParams(location.search),
      rawQuery: location.search,
    }),
    [hash, id, location.search],
  );
  const canResend = sessions.user.isAuthenticated || hasToken('user');
  const [isVerifying, setIsVerifying] = useState(isCallback);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [showSuccess, setShowSuccess] = useState(Boolean(location.state?.emailNotice));
  const [error, setError] = useState('');
  const [failureState, setFailureState] = useState('');
  const [resendCooldown, setResendCooldown] = useState(location.state?.emailNotice ? DEFAULT_RESEND_COOLDOWN : 0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isCallback) return undefined;
    let active = true;

    const verify = async () => {
      setIsVerifying(true);
      setError('');
      setFailureState('');
      try {
        const payload = await verifyUserEmail(verificationRequest);
        if (!active) return;
        navigate(PATHS.EMAIL_VERIFIED, {
          replace: true,
          state: { message: payload?.message || '' },
        });
      } catch (requestError) {
        if (!active) return;
        const state = getVerificationFailureState(requestError);
        if (state === 'already_verified' || getBackendErrorCode(requestError) === USER_AUTH_CODES.ALREADY_VERIFIED) {
          clearSession('user');
          navigate(PATHS.EMAIL_VERIFIED, {
            replace: true,
            state: { message: tr('هذا البريد الإلكتروني موثّق بالفعل. يمكنك تسجيل الدخول.', 'This email is already verified. You can sign in.') },
          });
          return;
        }
        setFailureState(state);
        setError(getErrorMessage(requestError, tr('تعذر التحقق من البريد الإلكتروني.', 'Could not verify your email.')));
        setIsVerifying(false);
      }
    };

    verify();
    return () => { active = false; };
  }, [clearSession, isCallback, navigate, tr, verificationRequest, verifyUserEmail]);

  const resend = async () => {
    if (isResending || resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    setMessage('');
    try {
      const payload = await resendUserVerification();
      setMessage(payload?.message || tr('تم إرسال رابط التحقق من البريد الإلكتروني بنجاح.', 'Verification link sent.'));
      setShowSuccess(true);
      setResendCooldown(DEFAULT_RESEND_COOLDOWN);
    } catch (requestError) {
      if (getBackendErrorCode(requestError) === USER_AUTH_CODES.RATE_LIMITED || requestError?.status === 429) {
        const seconds = getRetryAfterSeconds(requestError, DEFAULT_RESEND_COOLDOWN);
        setResendCooldown(seconds);
        setError(tr(`تم إرسال طلبات كثيرة. حاول مجددًا بعد ${seconds} ثانية.`, `Too many requests. Try again in ${seconds} seconds.`));
      } else {
        setError(getErrorMessage(requestError, tr('تعذر إعادة إرسال رابط التحقق.', 'Could not resend the verification link.')));
      }
    } finally {
      setIsResending(false);
    }
  };

  const resendLabel = isResending
    ? tr('جارٍ إرسال رابط جديد...', 'Sending a new link...')
    : resendCooldown > 0
      ? tr(`إعادة الإرسال بعد ${resendCooldown}ث`, `Resend in ${resendCooldown}s`)
      : tr('إعادة إرسال رابط التحقق', 'Resend verification link');

  if (isCallback && isVerifying) {
    return (
      <div className="auth-form auth-state-card auth-state-card--verify">
        <div className="auth-mail-visual" aria-hidden="true"><span><AuthIcon name="mail" size={31}/></span></div>
        <span className="auth-kicker">{tr('تأكيد البريد الإلكتروني', 'Email verification')}</span>
        <h1>{tr('جارٍ التحقق من الرابط', 'Verifying your link')}</h1>
        <p>{tr('يتم الآن التحقق من الرابط مع الخادم. لا تغلق الصفحة حتى تكتمل العملية.', 'We are checking your link. Please keep this page open.')}</p>
      </div>
    );
  }

  if (isCallback && error) {
    const title = failureState === 'expired'
      ? tr('انتهت صلاحية رابط التحقق', 'This verification link has expired')
      : failureState === 'invalid'
        ? tr('رابط التحقق غير صالح', 'This verification link is invalid')
        : tr('الرابط غير صالح أو منتهي الصلاحية', 'This link is invalid or has expired');

    return (
      <div className="auth-form auth-state-card auth-state-card--verify">
        <span className="auth-state-icon"><AuthIcon name="mail" size={27}/></span>
        <span className="auth-kicker">{tr('تعذر التحقق', 'Verification failed')}</span>
        <h1>{title}</h1>
        <AuthApiAlert message={error} />
        {canResend ? (
          <button className="auth-secondary-btn auth-secondary-state-btn" type="button" onClick={resend} disabled={isResending || resendCooldown > 0}>
            {resendLabel}
          </button>
        ) : (
          <Link className="auth-secondary-btn auth-secondary-state-btn" to={PATHS.LOGIN}>{tr('تسجيل الدخول لطلب رابط جديد', 'Sign in to request a new link')}</Link>
        )}
        <p className="auth-switch">{tr('تحتاج إلى تسجيل الدخول؟ ', 'Need to sign in? ')}<Link to={PATHS.LOGIN}>{tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link></p>
        {showSuccess && <AuthSuccessAlert title={tr('تم إرسال رابط التحقق', 'Verification link sent')} message={locale === 'en' ? 'Check your inbox for the verification link.' : (message || 'راجع بريدك الإلكتروني لفتح رابط التحقق.')} onClose={() => setShowSuccess(false)} />}
      </div>
    );
  }

  return (
    <div className="auth-form auth-state-card auth-state-card--verify">
      <div className="auth-mail-visual" aria-hidden="true">
        <span><AuthIcon name="mail" size={31}/></span>
        <i className="auth-mail-pulse auth-mail-pulse--1" />
        <i className="auth-mail-pulse auth-mail-pulse--2" />
      </div>
      <span className="auth-kicker">{tr('تأكيد البريد الإلكتروني', 'Email verification')}</span>
      <h1>{tr('راجع صندوق الوارد', 'Check your inbox')}</h1>
      <p>{tr('أرسلنا رابط تحقق إلى', 'We sent a verification link to')} <strong>{email}</strong>. {tr('افتح الرابط لتأكيد بريدك الإلكتروني وإكمال تفعيل حسابك.', 'Open it to verify your email and activate your account.')}</p>

      <AuthApiAlert message={error} />

      <div className="auth-verification-list">
        <span><i>1</i><b>{tr('افتح رسالة التحقق', 'Open the verification email')}</b><small>{tr('الرابط مخصص لحسابك ولمدة محدودة.', 'This link is unique to your account and expires soon.')}</small></span>
        <span><i>2</i><b>{tr('اضغط تأكيد البريد', 'Confirm your email')}</b><small>{tr('سنؤكد وسيلة التواصل المرتبطة بالحساب.', 'This confirms your account email.')}</small></span>
        <span><i>3</i><b>{tr('سجّل الدخول', 'Sign in')}</b><small>{tr('بعد نجاح التحقق سجّل الدخول لإنشاء جلسة كاملة والوصول للوحة التحكم.', 'After verification, sign in to create a full session and access the dashboard.')}</small></span>
      </div>

      <button className="auth-secondary-btn auth-secondary-state-btn" type="button" onClick={resend} disabled={isResending || resendCooldown > 0 || !canResend}>
        {canResend ? resendLabel : tr('سجّل الدخول لطلب رابط جديد', 'Sign in to request a new link')}
      </button>
      {!canResend && <p className="auth-switch"><Link to={PATHS.LOGIN}>{tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link></p>}
      <p className="auth-switch">{tr('كتبت البريد بشكل خاطئ؟ ', 'Wrong email address? ')}<Link to={PATHS.REGISTER}>{tr('العودة للتسجيل', 'Back to sign up')}</Link></p>
      {showSuccess && <AuthSuccessAlert title={tr('تم إرسال رابط التحقق', 'Verification link sent')} message={locale === 'en' ? 'Check your inbox for the verification link.' : (message || 'راجع بريدك الإلكتروني لفتح رابط التحقق.')} onClose={() => setShowSuccess(false)} />}
    </div>
  );
}

import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import AuthApiAlert from '../../../auth/components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import { getErrorMessage } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { PATHS } from '../../../../routes/paths';
import AuthSuccessAlert from '../../../auth/components/AuthSuccessAlert/AuthSuccessAlert';
import { useLocale } from '../../../../context/LocaleContext';
import { hasToken } from '../../../../utils/tokenManager';
import { resolveEmailVerificationCallback } from '../../../auth/utils/emailVerificationCallback';

export default function ExpertEmailVerification() {
  const { id, hash } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendExpertVerification, verifyExpertEmail, sessions } = useAuth();
  const { locale, tr } = useLocale();
  const email = searchParams.get('email') || tr('بريدك الإلكتروني', 'your email');
  const { isCallback, request: verificationRequest } = useMemo(
    () => resolveEmailVerificationCallback({
      id,
      hash,
      searchParams: new URLSearchParams(location.search),
      rawQuery: location.search,
    }),
    [hash, id, location.search],
  );
  const canResend = sessions.expert.isAuthenticated || hasToken('expert');
  const [isVerifying, setIsVerifying] = useState(isCallback);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [showSuccess, setShowSuccess] = useState(Boolean(location.state?.emailNotice));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isCallback) return undefined;
    let active = true;

    const verify = async () => {
      setIsVerifying(true);
      setError('');
      try {
        const payload = await verifyExpertEmail(verificationRequest);
        if (!active) return;
        navigate(PATHS.EXPERT_EMAIL_VERIFIED, {
          replace: true,
          state: { message: payload?.message || '' },
        });
      } catch (requestError) {
        if (!active) return;
        setError(getErrorMessage(requestError, tr('تعذر التحقق من بريد الخبير.', 'Could not verify your expert email.')));
        setIsVerifying(false);
      }
    };

    verify();
    return () => { active = false; };
  }, [isCallback, navigate, verificationRequest, verifyExpertEmail]);

  const resend = async () => {
    if (isResending) return;
    setIsResending(true);
    setError('');
    setMessage('');
    try {
      const payload = await resendExpertVerification();
      setMessage(payload?.message || tr('تم إرسال رابط التحقق من البريد الإلكتروني بنجاح.', 'Verification link sent.'));
      setShowSuccess(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError, tr('تعذر إعادة إرسال رابط التحقق.', 'Could not resend the verification link.')));
    } finally {
      setIsResending(false);
    }
  };

  if (isCallback && isVerifying) {
    return (
      <div className="auth-form auth-form auth-state-card auth-state-card--verify">
        <div className="auth-mail-visual" aria-hidden="true"><span><AuthIcon name="mail" size={31}/></span></div>
        <span className="auth-kicker">{tr('تأكيد البريد الإلكتروني', 'Email verification')}</span>
        <h1>{tr('جارٍ التحقق من الرابط', 'Verifying your link')}</h1>
        <p>{tr('يتم الآن التحقق من رابط بريد الخبير مع الخادم.', 'We are checking your expert verification link.')}</p>
      </div>
    );
  }

  if (isCallback && error) {
    return (
      <div className="auth-form auth-form auth-state-card auth-state-card--verify">
        <span className="auth-state-icon"><AuthIcon name="mail" size={27}/></span>
        <span className="auth-kicker">{tr('تعذر التحقق', 'Verification failed')}</span>
        <h1>{tr('الرابط غير صالح أو منتهي الصلاحية', 'This link is invalid or has expired')}</h1>
        <AuthApiAlert message={error} />
        {canResend ? (
          <button className="auth-secondary-btn auth-secondary-btn" type="button" onClick={resend} disabled={isResending}>
            {isResending ? tr('جارٍ إرسال رابط جديد...', 'Sending a new link...') : tr('إرسال رابط تحقق جديد', 'Send a new verification link')}
          </button>
        ) : (
          <Link className="auth-secondary-btn auth-secondary-btn" to={PATHS.EXPERT_LOGIN}>{tr('تسجيل الدخول لطلب رابط جديد', 'Sign in to request a new link')}</Link>
        )}
        <p className="auth-switch">{tr('تحتاج إلى تسجيل الدخول؟ ', 'Need to sign in? ')}<Link to={PATHS.EXPERT_LOGIN}>{tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link></p>
        {showSuccess && <AuthSuccessAlert title={tr('تم إرسال رابط التحقق', 'Verification link sent')} message={locale === 'en' ? 'Check your inbox for the verification link.' : (message || 'راجع بريدك الإلكتروني لفتح رابط التحقق.')} onClose={() => setShowSuccess(false)} />}
      </div>
    );
  }

  return (
    <div className="auth-form auth-form auth-state-card auth-state-card--verify">
      <div className="auth-mail-visual" aria-hidden="true">
        <span><AuthIcon name="mail" size={31}/></span>
        <i className="auth-mail-pulse auth-mail-pulse--1" />
        <i className="auth-mail-pulse auth-mail-pulse--2" />
      </div>
      <span className="auth-kicker">{tr('تأكيد البريد الإلكتروني', 'Email verification')}</span>
      <h1>{tr('راجع صندوق الوارد', 'Check your inbox')}</h1>
      <p>{tr('أرسلنا رابط تحقق إلى', 'We sent a verification link to')} <strong>{email}</strong>. {tr('افتح الرابط لإكمال تأكيد وسيلة التواصل الخاصة بحساب الخبير.', 'Open it to verify the email on your expert account.')}</p>

      <AuthApiAlert message={error} />

      <div className="auth-verification-list">
        <span><i>1</i><b>{tr('افتح رسالة التحقق', 'Open the verification email')}</b><small>{tr('الرابط مخصص للحساب ولمدة محدودة.', 'This link is unique to your account and expires soon.')}</small></span>
        <span><i>2</i><b>{tr('اضغط تأكيد البريد', 'Confirm your email')}</b><small>{tr('لن ينشر ذلك ملفك المهني.', 'Your expert profile will not be published yet.')}</small></span>
        <span><i>3</i><b>{tr('أكمل ملف الخبير', 'Complete your expert profile')}</b><small>{tr('بعد التحقق تنتقل لمسار الانضمام المهني.', 'Continue the expert onboarding process.')}</small></span>
      </div>

      <button className="auth-secondary-btn auth-secondary-btn" type="button" onClick={resend} disabled={isResending}>
        {isResending ? tr('جارٍ إرسال رابط جديد...', 'Sending a new link...') : tr('إعادة إرسال رابط التحقق', 'Resend verification link')}
      </button>
      <p className="auth-switch">{tr('كتبت البريد بشكل خاطئ؟ ', 'Wrong email address? ')}<Link to={PATHS.EXPERT_REGISTER}>{tr('العودة للتسجيل', 'Back to sign up')}</Link></p>
      {showSuccess && <AuthSuccessAlert title={tr('تم إرسال رابط التحقق', 'Verification link sent')} message={locale === 'en' ? 'Check your inbox for the verification link.' : (message || 'راجع بريدك الإلكتروني لفتح رابط التحقق.')} onClose={() => setShowSuccess(false)} />}
    </div>
  );
}

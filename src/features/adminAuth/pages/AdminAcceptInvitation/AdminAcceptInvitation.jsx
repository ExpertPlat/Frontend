import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { useLocale } from '../../../../context/LocaleContext';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import PasswordToggle from '../../../auth/components/PasswordToggle/PasswordToggle';
import { PATHS } from '../../../../routes/paths';
import { adminAuthService } from '../../../../services/auth/adminAuthService';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export default function AdminAcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tr } = useLocale();
  const { notify } = useBrandFeedback();
  const email = (searchParams.get('email') || '').trim();
  const token = (searchParams.get('token') || '').trim();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [requestError, setRequestError] = useState('');

  const clientErrors = useMemo(() => ({
    email: email ? '' : tr('رابط الدعوة لا يحتوي بريدًا إلكترونيًا.', 'The invitation link is missing the email address.'),
    token: token ? '' : tr('رابط الدعوة لا يحتوي رمز الدعوة.', 'The invitation link is missing the invitation token.'),
    password: password && !STRONG_PASSWORD.test(password)
      ? tr('استخدم 12 حرفًا على الأقل مع حرف كبير وصغير ورقم ورمز.', 'Use at least 12 characters with uppercase, lowercase, a number, and a symbol.')
      : '',
    password_confirmation: confirmation && confirmation !== password
      ? tr('تأكيد كلمة المرور غير مطابق.', 'Password confirmation does not match.')
      : '',
  }), [confirmation, email, password, token, tr]);

  const startCooldown = () => {
    setCooldown(true);
    window.setTimeout(() => setCooldown(false), 10000);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setRequestError('');
    setFieldErrors({});
    if (!email || !token || !STRONG_PASSWORD.test(password) || confirmation !== password || busy || cooldown) return;

    setBusy(true);
    try {
      await adminAuthService.acceptInvitation({
        email,
        token,
        password,
        password_confirmation: confirmation,
      });
      notify({
        title: tr('تم قبول الدعوة', 'Invitation accepted'),
        message: tr('تم إعداد حساب الإدارة. يمكنك تسجيل الدخول الآن.', 'Your admin account is ready. You can sign in now.'),
        tone: 'success',
      });
      navigate(PATHS.ADMIN_LOGIN, { replace: true });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setRequestError(getErrorMessage(error, tr('تعذر قبول الدعوة. تحقق من الرابط وحاول مرة أخرى.', 'Could not accept the invitation. Check the link and try again.')));
      if (error?.status === 429) startCooldown();
    } finally {
      setBusy(false);
    }
  };

  const passwordError = (submitted && !password)
    ? tr('أدخل كلمة مرور جديدة.', 'Enter a new password.')
    : clientErrors.password || getFirstFieldError(fieldErrors, 'password');
  const confirmationError = (submitted && !confirmation)
    ? tr('أعد كتابة كلمة المرور.', 'Confirm the password.')
    : clientErrors.password_confirmation || getFirstFieldError(fieldErrors, 'password_confirmation');

  return (
    <form className="auth-form auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading auth-form__heading">
        <h1>{tr('قبول دعوة الإدارة', 'Accept admin invitation')}</h1>
        <p>{tr('أنشئ كلمة مرور قوية لإكمال تفعيل حسابك الإداري.', 'Create a strong password to finish activating your admin account.')}</p>
      </div>

      {(!email || !token) && (
        <div className="auth-alert" role="alert">
          <AuthIcon name="shield" size={16}/>
          <span>{clientErrors.email || clientErrors.token}</span>
        </div>
      )}
      {requestError && <div className="auth-alert" role="alert"><AuthIcon name="shield" size={16}/><span>{requestError}</span></div>}

      <div className="auth-form__fields">
        <div className="auth-field">
          <label htmlFor="admin-invitation-email">{tr('البريد الإلكتروني', 'Email')}</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon"><AuthIcon name="mail" size={19}/></span>
            <input id="admin-invitation-email" type="email" value={email} readOnly dir="ltr" aria-readonly="true" />
          </div>
          {getFirstFieldError(fieldErrors, 'email') && <small className="auth-error">{getFirstFieldError(fieldErrors, 'email')}</small>}
        </div>

        <div className={`auth-field ${passwordError ? 'auth-field--error' : ''}`}>
          <label htmlFor="admin-invitation-password">{tr('كلمة المرور الجديدة', 'New password')}</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon"><AuthIcon name="lock" size={19}/></span>
            <input id="admin-invitation-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setRequestError(''); }} autoComplete="new-password" aria-invalid={Boolean(passwordError)} />
            <PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />
          </div>
          {passwordError && <small className="auth-error">{passwordError}</small>}
        </div>

        <div className={`auth-field ${confirmationError ? 'auth-field--error' : ''}`}>
          <label htmlFor="admin-invitation-password-confirmation">{tr('تأكيد كلمة المرور', 'Confirm password')}</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon"><AuthIcon name="lock" size={19}/></span>
            <input id="admin-invitation-password-confirmation" type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setRequestError(''); }} autoComplete="new-password" aria-invalid={Boolean(confirmationError)} />
            <PasswordToggle visible={showConfirmation} onClick={() => setShowConfirmation((value) => !value)} label={showConfirmation ? tr('إخفاء التأكيد', 'Hide confirmation') : tr('إظهار التأكيد', 'Show confirmation')} />
          </div>
          {confirmationError && <small className="auth-error">{confirmationError}</small>}
        </div>
      </div>

      <div className="auth-security-note"><AuthIcon name="shield" size={16}/><span>{tr('يجب أن تتكون كلمة المرور من 12 حرفًا على الأقل وتشمل حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا.', 'Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.')}</span></div>

      <button className="auth-primary-btn auth-primary-btn" type="submit" disabled={busy || cooldown || !email || !token} aria-busy={busy}>
        {busy ? tr('جارٍ تفعيل الحساب...', 'Activating account...') : cooldown ? tr('انتظر قليلًا قبل إعادة المحاولة', 'Please wait before retrying') : tr('تفعيل الحساب الإداري', 'Activate admin account')}
      </button>
    </form>
  );
}

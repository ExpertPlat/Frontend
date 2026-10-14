import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import AuthInput from '../../../auth/components/AuthInput/AuthInput';
import PasswordToggle from '../../../auth/components/PasswordToggle/PasswordToggle';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { PATHS } from '../../../../routes/paths';
import { getAdminLoginErrors } from '../../utils/adminAuthValidation';
import DemoFill from '../../../demo/DemoFill';
import { useLocale } from '../../../../context/LocaleContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin } = useAuth();
  const { locale, tr } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [authError, setAuthError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const errors = useMemo(() => getAdminLoginErrors({ email, password }, locale), [email, password, locale]);
  const hasErrors = Boolean(errors.email || errors.password);

  const clearServerErrors = () => {
    setAuthError('');
    setFieldErrors({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    clearServerErrors();
    if (hasErrors || isSubmitting || rateLimited) return;

    setIsSubmitting(true);
    try {
      await loginAdmin({ email: email.trim(), password }, remember);
      const from = location.state?.from;
      const destination = from ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}` : PATHS.ADMIN_DASHBOARD;
      navigate(destination || PATHS.ADMIN_DASHBOARD, { replace: true });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setAuthError(getErrorMessage(error, 'تعذر تسجيل دخول الإدارة. حاول مرة أخرى.'));
      if (error?.status === 429) {
        setRateLimited(true);
        window.setTimeout(() => setRateLimited(false), 10000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading auth-form__heading">
        <h1>{tr('تسجيل دخول الإدارة', 'Admin sign in')}</h1>
        <p>{tr('أدخل بيانات حسابك الإداري للوصول إلى مساحة الإدارة.', 'Use your admin credentials to access the management space.')}</p>
      </div>

      {authError && (
        <div className="auth-alert" role="alert">
          <AuthIcon name="shield" size={16}/>
          <span>{authError}</span>
        </div>
      )}

      <div className="auth-form__fields">
        <AuthInput
          id="admin-login-email"
          label={tr('البريد الإلكتروني الإداري', 'Admin email')}
          icon="mail"
          type="email"
          value={email}
          onChange={(event) => { setEmail(event.target.value); clearServerErrors(); }}
          placeholder="admin@example.com"
          autoComplete="email"
          error={submitted ? (errors.email || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')}
        />
        <AuthInput
          id="admin-login-password"
          label={tr('كلمة المرور', 'Password')}
          icon="lock"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => { setPassword(event.target.value); clearServerErrors(); }}
          placeholder="••••••••"
          autoComplete="current-password"
          error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')}
          endAction={(
            <PasswordToggle
              visible={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')}
            />
          )}
        />
      </div>

      <div className="auth-form__options auth-form__options">
        <label className="auth-check">
          <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
          <span>{tr('تذكرني على هذا الجهاز', 'Remember me on this device')}</span>
        </label>
      </div>

      <button className="auth-primary-btn auth-primary-btn" type="submit" disabled={isSubmitting || rateLimited} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-spinner" aria-hidden="true" /> {tr('جارٍ التحقق...', 'Checking...')}</> : rateLimited ? tr('انتظر قليلًا قبل إعادة المحاولة', 'Please wait before retrying') : <>{tr('تسجيل الدخول', 'Sign in')} <AuthIcon name="arrow" size={18}/></>}
      </button>
      <DemoFill role="admin" onFill={(a) => { setEmail(a.email); setPassword(a.password); clearServerErrors(); }} />

      <p className="auth-help">{tr('لا توجد إمكانية لإنشاء حساب إداري من هذه الصفحة. يتم منح صلاحيات الإدارة من خلال النظام المصرح به فقط.', 'Admin accounts are created by authorized platform administrators.')}</p>
    </form>
  );
}

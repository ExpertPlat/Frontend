import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import AuthApiAlert from '../../components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import AuthInput from '../../components/AuthInput/AuthInput';
import PasswordToggle from '../../components/PasswordToggle/PasswordToggle';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getLoginErrors } from '../../utils/authValidation';
import { PATHS } from '../../../../routes/paths';
import ForgotPasswordModal from '../../components/ForgotPasswordModal/ForgotPasswordModal';
import { useLocale } from '../../../../context/LocaleContext';
import DemoFill from '../../../demo/DemoFill';
import { getBackendErrorCode, getUserLoginErrorMessage, USER_AUTH_CODES } from '../../utils/userAuthErrors';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const showForgot = searchParams.get('forgot') === '1';
  const closeForgot = () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('forgot'); return next; }, { replace: true });
  const { loginUser } = useAuth();
  const { locale, tr } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const errors = useMemo(() => getLoginErrors({ email, password }, locale), [email, password, locale]);
  const hasErrors = Boolean(errors.email || errors.password);

  const clearServerErrors = () => {
    setGeneralError('');
    setFieldErrors({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    clearServerErrors();
    if (hasErrors || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await loginUser({ email: email.trim(), password }, remember);
      const from = location.state?.from;
      const destination = from ? `${from.pathname || ''}${from.search || ''}${from.hash || ''}` : PATHS.USER_DASHBOARD;
      navigate(destination || PATHS.USER_DASHBOARD, { replace: true });
    } catch (error) {
      if (getBackendErrorCode(error) === USER_AUTH_CODES.EMAIL_NOT_VERIFIED) {
        navigate(PATHS.VERIFY_EMAIL, {
          replace: true,
          state: { message: error.payload?.message || '', emailNotice: false, email: email.trim() },
        });
        return;
      }

      const nextFieldErrors = getFieldErrors(error);
      setFieldErrors(nextFieldErrors);
      setGeneralError(getUserLoginErrorMessage(error, tr) || getErrorMessage(error, tr('تعذر تسجيل الدخول. حاول مرة أخرى.', 'Could not sign in. Please try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (<>
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading">
        <h1>{tr('أهلًا بعودتك', 'Welcome back')}</h1>
        <p>{tr('سجّل دخولك لمتابعة حالاتك واستشاراتك.', 'Sign in to follow your cases and consultations.')}</p>
      </div>

      <AuthApiAlert message={generalError} />

      <div className="auth-form__fields">
        <AuthInput id="login-email" label={tr('البريد الإلكتروني', 'Email address')} icon="mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearServerErrors(); }} placeholder="name@example.com" autoComplete="email" error={submitted ? (errors.email || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')} />
        <AuthInput id="login-password" label={tr('كلمة المرور', 'Password')} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearServerErrors(); }} placeholder="••••••••" autoComplete="current-password" error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')} endAction={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((v) => !v)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />} />
      </div>

      <div className="auth-form__options">
        <label className="auth-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>{tr('تذكرني', 'Remember me')}</span></label>
        <button className="auth-text-button" type="button" onClick={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('forgot', '1'); return next; })}>{tr('نسيت كلمة المرور؟', 'Forgot password?')}</button>
      </div>

      <button className="auth-primary-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ تسجيل الدخول...', 'Signing in...')}</> : <>{tr('تسجيل الدخول', 'Sign in')} <AuthIcon name="arrow" size={18}/></>}
      </button>
      <DemoFill role="user" onFill={(a) => { setEmail(a.email); setPassword(a.password); clearServerErrors(); }} />
      <p className="auth-switch">{tr('ليس لديك حساب؟', 'New here?')} <Link to={PATHS.REGISTER}>{tr('أنشئ حسابًا جديدًا', 'Create an account')}</Link></p>
    </form>
    {showForgot && <ForgotPasswordModal onClose={closeForgot} />}
  </>);
}

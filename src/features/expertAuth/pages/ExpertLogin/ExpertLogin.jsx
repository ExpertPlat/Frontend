import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import AuthApiAlert from '../../../auth/components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import AuthInput from '../../../auth/components/AuthInput/AuthInput';
import PasswordToggle from '../../../auth/components/PasswordToggle/PasswordToggle';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getExpertLoginErrors } from '../../utils/expertAuthValidation';
import { PATHS } from '../../../../routes/paths';
import ForgotPasswordModal from '../../../auth/components/ForgotPasswordModal/ForgotPasswordModal';
import DemoLoginPanel from '../../../demo/DemoLoginPanel';
import { useLocale } from '../../../../context/LocaleContext';

export default function ExpertLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const showForgot = searchParams.get('forgot') === '1';
  const closeForgot = () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('forgot'); return next; }, { replace: true });
  const { loginExpert } = useAuth();
  const { locale, tr } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const errors = useMemo(() => getExpertLoginErrors({ email, password }, locale), [email, password, locale]);
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
      const payload = await loginExpert({ email: email.trim(), password }, remember);
      if (payload?.data?.email_verified === false) {
        navigate(`${PATHS.EXPERT_VERIFY_EMAIL}?email=${encodeURIComponent(email.trim())}`, { replace: true });
        return;
      }

      const from = location.state?.from;
      if (from) {
        navigate(`${from.pathname || ''}${from.search || ''}${from.hash || ''}` || PATHS.EXPERT_DASHBOARD, { replace: true });
      } else {
        navigate(PATHS.EXPERT_DASHBOARD, { replace: true });
      }
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setGeneralError(getErrorMessage(error, tr('تعذر تسجيل دخول الخبير. حاول مرة أخرى.', 'Could not sign in. Please try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (<>
    <form className="auth-form auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading auth-form__heading">
        <h1>{tr('مرحبًا بعودتك', 'Welcome back')}</h1>
        <p>{tr('سجّل دخولك لمتابعة ملفك وطلباتك المهنية.', 'Sign in to follow your expert profile and requests.')}</p>
      </div>

      <DemoLoginPanel role="expert" onFill={(a) => { setEmail(a.email); setPassword(a.password); clearServerErrors(); }} />

      <AuthApiAlert message={generalError} />

      <div className="auth-form__fields">
        <AuthInput id="expert-login-email" label={tr('البريد الإلكتروني', 'Email address')} icon="mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearServerErrors(); }} placeholder="name@example.com" autoComplete="email" error={submitted ? (errors.email || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')} />
        <AuthInput id="expert-login-password" label={tr('كلمة المرور', 'Password')} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearServerErrors(); }} placeholder="••••••••" autoComplete="current-password" error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')} endAction={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />} />
      </div>

      <div className="auth-form__options">
        <label className="auth-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>{tr('تذكرني', 'Remember me')}</span></label>
        <button className="auth-text-button auth-text-link" type="button" onClick={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('forgot', '1'); return next; })}>{tr('نسيت كلمة المرور؟', 'Forgot password?')}</button>
      </div>

      <button className="auth-primary-btn auth-primary-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ تسجيل الدخول...', 'Signing in...')}</> : <>{tr('دخول مساحة الخبير', 'Expert sign in')} <AuthIcon name="arrow" size={18}/></>}
      </button>
      <p className="auth-switch">{tr('ليس لديك دور خبير بعد؟', 'New to SolveIt?')} <Link to={PATHS.EXPERT_REGISTER}>{tr('انضم كخبير', 'Join as expert')}</Link></p>
      <p className="auth-secondary-switch">{tr('تريد الدخول كمستخدم عادي؟', 'Using a personal account?')} <Link to={PATHS.LOGIN}>{tr('تسجيل دخول المستخدم', 'User sign in')}</Link></p>
    </form>
    {showForgot && <ForgotPasswordModal accountType="expert" onClose={closeForgot} />}
  </>);
}

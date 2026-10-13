import { Link, useNavigate } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import AuthApiAlert from '../../components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import AuthInput from '../../components/AuthInput/AuthInput';
import PasswordToggle from '../../components/PasswordToggle/PasswordToggle';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getPasswordStrength, getRegisterErrors } from '../../utils/authValidation';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';

export default function Register() {
  const navigate = useNavigate();
  const { locale, tr } = useLocale();
  const { registerUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const errors = useMemo(() => getRegisterErrors({ name, email, password, confirm, terms }, locale), [name, email, password, confirm, terms, locale]);
  const hasErrors = Object.values(errors).some(Boolean);

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
      const payload = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
      });
      navigate(PATHS.VERIFY_EMAIL, {
        replace: true,
        state: { message: payload?.message || '', emailNotice: true, email: email.trim() },
      });
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setGeneralError(getErrorMessage(error, tr('تعذر إنشاء الحساب. راجع البيانات وحاول مرة أخرى.', 'Could not create the account. Check your details and try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form auth-form--register" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading">
        <h1>{tr('أنشئ حسابك', 'Create your account')}</h1>
        <p>{tr('خطوة قصيرة لتبدأ رحلتك مع الخبراء.', 'A simple step toward the right expertise.')}</p>
      </div>

      <AuthApiAlert message={generalError} />

      <div className="auth-form__fields auth-form__fields--register">
        <AuthInput id="register-name" label={tr('الاسم الكامل', 'Full name')} icon="user" value={name} onChange={(e) => { setName(e.target.value); clearServerErrors(); }} placeholder={tr('اكتب اسمك الكامل', 'Enter your full name')} autoComplete="name" error={submitted ? (errors.name || getFirstFieldError(fieldErrors, 'name')) : getFirstFieldError(fieldErrors, 'name')} />
        <AuthInput id="register-email" label={tr('البريد الإلكتروني', 'Email address')} icon="mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearServerErrors(); }} placeholder="name@example.com" autoComplete="email" error={submitted ? (errors.email || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')} />
        <AuthInput id="register-password" label={tr('كلمة المرور', 'Password')} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearServerErrors(); }} placeholder={tr('8 أحرف أو أكثر', '8 characters or more')} autoComplete="new-password" error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')} endAction={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((v) => !v)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />} />
        <AuthInput id="register-confirm" label={tr('تأكيد كلمة المرور', 'Confirm password')} icon="lock" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); clearServerErrors(); }} placeholder={tr('أعد كتابة كلمة المرور', 'Re-enter your password')} autoComplete="new-password" error={submitted ? (errors.confirm || getFirstFieldError(fieldErrors, 'password_confirmation')) : getFirstFieldError(fieldErrors, 'password_confirmation')} endAction={<PasswordToggle visible={showConfirm} onClick={() => setShowConfirm((v) => !v)} label={showConfirm ? tr('إخفاء تأكيد كلمة المرور', 'Hide confirmation') : tr('إظهار تأكيد كلمة المرور', 'Show confirmation')} />} />
      </div>

      {password && (
        <div className="auth-strength auth-register-strength" aria-label={tr('قوة كلمة المرور', 'Password strength')}>
          <div className="auth-strength__bars">{[1, 2, 3, 4].map((n) => <i key={n} className={n <= strength ? 'is-on' : ''} />)}</div>
          <span>{strength <= 1 ? tr('ضعيفة', 'Weak') : strength === 2 ? tr('متوسطة', 'Fair') : strength === 3 ? tr('جيدة', 'Good') : tr('قوية', 'Strong')}</span>
        </div>
      )}

      <label className={`auth-check auth-check--terms ${submitted && errors.terms ? 'auth-check--error' : ''}`}>
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>{tr('أوافق على ', 'I agree to the ')}<Link to={PATHS.TERMS} target="_blank" rel="noopener noreferrer">{tr('الشروط والأحكام', 'Terms and Conditions')}</Link>{tr(' و', ' and ')}<Link to={PATHS.PRIVACY} target="_blank" rel="noopener noreferrer">{tr('سياسة الخصوصية', 'Privacy Policy')}</Link>.</span>
      </label>
      {submitted && errors.terms && <small className="auth-error auth-error--terms">{errors.terms}</small>}

      <button className="auth-primary-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ إنشاء الحساب...', 'Creating account...')}</> : <>{tr('إنشاء الحساب ', 'Create account ')}<AuthIcon name="arrow" size={18}/></>}
      </button>
      <p className="auth-switch">{tr('هل أنت خبير؟ ', 'Are you an expert? ')}<Link to={PATHS.EXPERT_REGISTER}>{tr('انضم كخبير', 'Join as an expert')}</Link></p>
      <p className="auth-switch">{tr('لديك حساب بالفعل؟ ', 'Already have an account? ')}<Link to={PATHS.LOGIN}>{tr('تسجيل الدخول', 'Sign in')}</Link></p>
    </form>
  );
}

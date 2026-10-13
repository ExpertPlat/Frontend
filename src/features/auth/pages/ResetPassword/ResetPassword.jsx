import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import AuthApiAlert from '../../components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import AuthInput from '../../components/AuthInput/AuthInput';
import PasswordToggle from '../../components/PasswordToggle/PasswordToggle';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getPasswordStrength, getResetPasswordErrors } from '../../utils/authValidation';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';
import { getResetFailureState } from '../../utils/userAuthErrors';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { locale, tr } = useLocale();
  const { resetUserPassword } = useAuth();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const errors = useMemo(() => getResetPasswordErrors({ password, confirm }, locale), [password, confirm, locale]);
  const hasErrors = Object.values(errors).some(Boolean);
  const hasResetParams = Boolean(email && token);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setGeneralError('');
    setFieldErrors({});
    if (!hasResetParams) {
      setGeneralError(tr('رابط الاستعادة غير مكتمل. اطلب رابطًا جديدًا وحاول مرة أخرى.', 'This reset link is incomplete. Request a new one.'));
      return;
    }
    if (hasErrors || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = await resetUserPassword({
        email,
        token,
        password,
        password_confirmation: confirm,
      });
      setSuccessMessage(payload?.message || tr('تم تغيير كلمة المرور بنجاح.', 'Password changed successfully.'));
      setSuccess(true);
      navigate(PATHS.RESET_PASSWORD, { replace: true });
    } catch (requestError) {
      const nextFieldErrors = getFieldErrors(requestError);
      setFieldErrors(nextFieldErrors);
      const resetState = getResetFailureState(requestError);
      const resetMessage = resetState === 'expired'
        ? tr('انتهت صلاحية رابط الاستعادة. اطلب رابطًا جديدًا.', 'This reset link has expired. Request a new one.')
        : resetState === 'invalid'
          ? tr('رابط الاستعادة غير صالح. اطلب رابطًا جديدًا.', 'This reset link is invalid. Request a new one.')
          : '';
      setGeneralError(resetMessage || getFirstFieldError(nextFieldErrors, 'email') || getErrorMessage(requestError, tr('تعذر تغيير كلمة المرور. حاول مرة أخرى.', 'Could not change your password. Try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="auth-form auth-state-card">
        <span className="auth-state-icon auth-state-icon--success"><AuthIcon name="check" size={29}/></span>
        <span className="auth-kicker">{tr('تم التحديث', 'Updated')}</span>
        <h1>{tr('تم تغيير كلمة المرور', 'Password changed')}</h1>
        <p>{successMessage}</p>
        <Link className="auth-primary-btn" to={PATHS.LOGIN}>{tr('تسجيل الدخول ', 'Sign in ')}<AuthIcon name="arrow" size={18}/></Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading">
        <h1>{tr('كلمة مرور جديدة', 'New password')}</h1>
        <p>{tr('اختر كلمة مرور جديدة لتستعيد الوصول إلى حسابك.', 'Choose a new password to regain access to your account.')}</p>
      </div>

      {!hasResetParams && <AuthApiAlert message={tr('رابط الاستعادة لا يحتوي على البريد الإلكتروني ورمز الاستعادة المطلوبين.', 'The reset link is missing an email address or token.')} />}
      <AuthApiAlert message={generalError} />

      <div className="auth-form__fields">
        <AuthInput id="reset-password" label={tr('كلمة المرور الجديدة', 'New password')} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setGeneralError(''); setFieldErrors({}); }} placeholder={tr('8 أحرف أو أكثر', '8 characters or more')} autoComplete="new-password" error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')} endAction={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />} />
        {password && (
          <div className="auth-strength" aria-label={tr('قوة كلمة المرور', 'Password strength')}>
            <div className="auth-strength__bars">{[1, 2, 3, 4].map((number) => <i key={number} className={number <= strength ? 'is-on' : ''}/>)}</div>
            <span>{strength <= 1 ? tr('ضعيفة', 'Weak') : strength === 2 ? tr('متوسطة', 'Fair') : strength === 3 ? tr('جيدة', 'Good') : tr('قوية', 'Strong')}</span>
          </div>
        )}
        <AuthInput id="reset-confirm" label={tr('تأكيد كلمة المرور', 'Confirm password')} icon="lock" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); setGeneralError(''); setFieldErrors({}); }} placeholder={tr('أعد كتابة كلمة المرور', 'Re-enter your password')} autoComplete="new-password" error={submitted ? (errors.confirm || getFirstFieldError(fieldErrors, 'password_confirmation')) : getFirstFieldError(fieldErrors, 'password_confirmation')} endAction={<PasswordToggle visible={showConfirm} onClick={() => setShowConfirm((value) => !value)} label={showConfirm ? tr('إخفاء تأكيد كلمة المرور', 'Hide confirmation') : tr('إظهار تأكيد كلمة المرور', 'Show confirmation')} />} />
      </div>

      <button className="auth-primary-btn auth-reset-submit" type="submit" disabled={isSubmitting || !hasResetParams} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ الحفظ...', 'Saving...')}</> : <>{tr('حفظ كلمة المرور الجديدة ', 'Save new password ')}<AuthIcon name="arrow" size={18}/></>}
      </button>
      <p className="auth-switch">{tr('تحتاج رابطًا جديدًا؟ ', 'Need a new link? ')}<Link to={`${PATHS.LOGIN}?forgot=1`}>{tr('طلب استعادة جديدة', 'Request a reset link')}</Link></p>
    </form>
  );
}

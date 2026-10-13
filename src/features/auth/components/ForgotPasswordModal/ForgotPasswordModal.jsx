import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AuthIcon from '../AuthIcon/AuthIcon';
import AuthInput from '../AuthInput/AuthInput';
import AuthApiAlert from '../AuthApiAlert/AuthApiAlert';
import AuthSuccessAlert from '../AuthSuccessAlert/AuthSuccessAlert';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getForgotPasswordError } from '../../utils/authValidation';
import { useLocale } from '../../../../context/LocaleContext';

export default function ForgotPasswordModal({ onClose, accountType = 'user' }) {
  const { forgotUserPassword, forgotExpertPassword } = useAuth();
  const { locale, dir, tr } = useLocale();
  const emailRef = useRef(null);
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const error = getForgotPasswordError(email, locale);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    emailRef.current?.querySelector('input')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setGeneralError('');
    setFieldErrors({});
    if (error || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const service = accountType === 'expert' ? forgotExpertPassword : forgotUserPassword;
      const payload = await service({ email: email.trim() });
      if (accountType === 'user') {
        setMessage(locale === 'en'
          ? 'If an account exists for this address, you will receive a password reset link shortly.'
          : 'إذا كان هناك حساب مرتبط بهذا البريد، فسيتم إرسال رابط الاستعادة خلال وقت قصير.');
      } else {
        setMessage(payload?.message || tr('إذا كان هناك حساب مرتبط بهذا البريد، فسيتم إرسال رابط الاستعادة.', 'If an account exists for this address, you will receive a password reset link.'));
      }
      setSent(true);
    } catch (requestError) {
      setFieldErrors(getFieldErrors(requestError));
      setGeneralError(getErrorMessage(requestError, tr('تعذر إرسال طلب الاستعادة. حاول مرة أخرى.', 'Could not send the reset link. Please try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) return <AuthSuccessAlert title={tr('تحقق من بريدك', 'Check your inbox')} message={message} onClose={onClose} />;

  return createPortal(
    <div className={`auth-dialog-backdrop${accountType === 'expert' ? ' auth-dialog-backdrop--expert' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form ref={dialogRef} className="auth-forgot-dialog" role="dialog" aria-modal="true" aria-labelledby="forgot-title" onSubmit={submit} noValidate dir={dir}>
        <button className="auth-forgot-dialog__close" type="button" onClick={onClose} aria-label={tr('إغلاق', 'Close')}><AuthIcon name="close"/></button>
        <span className="auth-forgot-dialog__icon" aria-hidden="true"><AuthIcon name="lock" size={24}/></span>
        <h2 id="forgot-title">{tr('نسيت كلمة المرور؟', 'Forgot your password?')}</h2>
        <p>{tr('أدخل بريد حسابك وسنرسل رابط الاستعادة إذا كان الحساب موجودًا.', 'Enter your account email and we will send a reset link if an account exists.')}</p>
        <AuthApiAlert message={generalError} />
        <div ref={emailRef}>
          <AuthInput
            id={accountType === 'expert' ? 'expert-forgot-email' : 'forgot-email'}
            label={tr('البريد الإلكتروني', 'Email address')}
            icon="mail"
            type="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setGeneralError(''); setFieldErrors({}); }}
            placeholder="name@example.com"
            autoComplete="email"
            error={submitted ? (error || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')}
          />
        </div>
        <button className="auth-primary-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? tr('جارٍ الإرسال...', 'Sending...') : tr('إرسال رابط الاستعادة', 'Send reset link')}
        </button>
      </form>
    </div>,
    document.body,
  );
}

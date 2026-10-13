import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import AuthApiAlert from '../../components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import AuthInput from '../../components/AuthInput/AuthInput';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getForgotPasswordError } from '../../utils/authValidation';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';

export default function ForgotPassword() {
  const { forgotUserPassword } = useAuth();
  const { tr } = useLocale();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const error = getForgotPasswordError(email);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setGeneralError('');
    setFieldErrors({});
    if (error || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = await forgotUserPassword({ email: email.trim() });
      setMessage(payload?.message || tr('إذا كان هناك حساب مستخدم مرتبط بهذا البريد، فسيتم إرسال رابط استعادة كلمة المرور.', 'If an account is linked to this email, we will send a password recovery link.'));
      setSent(true);
    } catch (requestError) {
      setFieldErrors(getFieldErrors(requestError));
      setGeneralError(getErrorMessage(requestError, tr('تعذر إرسال طلب الاستعادة. حاول مرة أخرى.', 'Could not send the recovery request. Please try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-form auth-state-card">
        <span className="auth-state-icon"><AuthIcon name="mail" size={27}/></span>
        <span className="auth-kicker">{tr('تم استلام الطلب', 'Request received')}</span>
        <h1>{tr('تحقق من بريدك', 'Check your email')}</h1>
        <p>{message}</p>
        <div className="auth-info-row"><AuthIcon name="shield" size={17}/><span>{tr('لأمان حسابك، لا يتم تغيير كلمة المرور إلا بعد فتح رابط الاستعادة الصحيح وإكمال العملية.', 'For your security, your password only changes after you open the correct recovery link and finish the process.')}</span></div>
        <Link className="auth-primary-btn" to={PATHS.LOGIN}>{tr('العودة لتسجيل الدخول ', 'Back to sign in ')}<AuthIcon name="arrow" size={18}/></Link>
        <button className="auth-inline-action" type="button" onClick={() => { setSent(false); setSubmitted(false); }}>{tr('استخدام بريد آخر', 'Use a different email')}</button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading">
        <span className="auth-kicker"><AuthIcon name="lock" size={14}/> {tr('استعادة كلمة المرور', 'Password recovery')}</span>
        <h1>{tr('نساعدك على العودة', 'Let us help you back in')}</h1>
        <p>{tr('أدخل بريد حسابك وسنرسل تعليمات الاستعادة إذا كان الحساب مؤهلًا.', 'Enter your account email and we will send recovery instructions if the account is eligible.')}</p>
      </div>

      <div className="auth-context-note"><AuthIcon name="shield" size={16}/><span><b>{tr('خصوصيتك أولًا', 'Your privacy first')}</b> {tr('ستظهر نفس رسالة التأكيد سواء كان البريد مسجلًا أم لا.', 'You will see the same confirmation whether or not the email is registered.')}</span></div>
      <AuthApiAlert message={generalError} />

      <AuthInput id="forgot-email" label={tr('البريد الإلكتروني', 'Email address')} icon="mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setGeneralError(''); setFieldErrors({}); }} placeholder="name@example.com" autoComplete="email" error={submitted ? (error || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')} />
      <button className="auth-primary-btn auth-submit-gap" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ الإرسال...', 'Sending...')}</> : <>{tr('إرسال تعليمات الاستعادة ', 'Send recovery instructions ')}<AuthIcon name="arrow" size={18}/></>}
      </button>
      <p className="auth-switch">{tr('تذكرت كلمة المرور؟', 'Remembered your password?')} <Link to={PATHS.LOGIN}>{tr('العودة لتسجيل الدخول', 'Back to sign in')}</Link></p>
    </form>
  );
}

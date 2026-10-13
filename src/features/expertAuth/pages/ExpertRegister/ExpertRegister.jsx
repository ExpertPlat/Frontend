import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AuthApiAlert from '../../../auth/components/AuthApiAlert/AuthApiAlert';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import AuthInput from '../../../auth/components/AuthInput/AuthInput';
import PasswordToggle from '../../../auth/components/PasswordToggle/PasswordToggle';
import ExpertSelect from '../../components/ExpertSelect/ExpertSelect';
import { getErrorMessage, getFieldErrors, getFirstFieldError } from '../../../../api/errorHandler';
import useAuth from '../../../../hooks/useAuth';
import { getExpertRegisterErrors, getPasswordStrength } from '../../utils/expertAuthValidation';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';

const ACCOUNT_FIELDS = ['name', 'email', 'password', 'confirm'];

export default function ExpertRegister() {
  const navigate = useNavigate();
  const { locale, tr } = useLocale();
  const { registerExpert } = useAuth();
  const [step, setStep] = useState(1);
  const stepHeadingRef = useRef(null);
  const previousStepRef = useRef(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [professionalDeclaration, setProfessionalDeclaration] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const errors = useMemo(() => getExpertRegisterErrors({
    name,
    email,
    country,
    language,
    domain,
    password,
    confirm,
    terms,
    professionalDeclaration,
  }, locale), [name, email, country, language, domain, password, confirm, terms, professionalDeclaration, locale]);

  useEffect(() => {
    if (previousStepRef.current !== step) stepHeadingRef.current?.focus();
    previousStepRef.current = step;
  }, [step]);

  const clearServerErrors = () => {
    setGeneralError('');
    setFieldErrors({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setSubmitted(true);
    clearServerErrors();

    if (step === 1) {
      if (ACCOUNT_FIELDS.some((field) => errors[field])) return;
      setStep(2);
      setSubmitted(false);
      return;
    }

    if (Object.values(errors).some(Boolean)) {
      if (ACCOUNT_FIELDS.some((field) => errors[field])) setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await registerExpert({
        name: name.trim(),
        email: email.trim(),
        country,
        language,
        domain,
        password,
        password_confirmation: confirm,
      });
      navigate(`${PATHS.EXPERT_VERIFY_EMAIL}?email=${encodeURIComponent(email.trim())}`, {
        replace: true,
        state: { message: payload?.message || '', emailNotice: true },
      });
    } catch (error) {
      const nextFieldErrors = getFieldErrors(error);
      setFieldErrors(nextFieldErrors);
      if (['name', 'email', 'password', 'password_confirmation'].some((field) => nextFieldErrors[field])) setStep(1);
      setGeneralError(getErrorMessage(error, tr('تعذر إنشاء حساب الخبير. راجع البيانات وحاول مرة أخرى.', 'Could not create the expert account. Check your details and try again.')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form auth-form auth-form--register" onSubmit={onSubmit} noValidate>
      <div className="auth-form__heading auth-form__heading">
        <h1>{tr('انضم كخبير', 'Join as an expert')}</h1>
        <p>{tr('أنشئ حسابك، ثم أكمل التحقق المهني قبل نشر خدماتك.', 'Create your account, then complete professional verification.')}</p>
      </div>

      <div className="auth-motion-step-heading" aria-live="polite" tabIndex={-1} ref={stepHeadingRef}>
        <span>{step === 1 ? tr('بيانات الحساب', 'Account details') : tr('البيانات المهنية', 'Professional details')}</span>
        <small>{tr('الخطوة', 'Step')} {step} {tr('من', 'of')} 2</small>
      </div>
      <div className="auth-motion-step-track" aria-hidden="true"><span style={{ width: step === 1 ? '50%' : '100%' }} /></div>
      <AuthApiAlert message={generalError} />

      <div className="auth-register-grid">
        {step === 1 ? (
          <>
        <AuthInput id="expert-register-name" label={tr('الاسم الكامل', 'Full name')} icon="user" value={name} onChange={(e) => { setName(e.target.value); clearServerErrors(); }} placeholder={tr('الاسم كما سيظهر في طلب التحقق', 'Name on your verification request')} autoComplete="name" error={submitted ? (errors.name || getFirstFieldError(fieldErrors, 'name')) : getFirstFieldError(fieldErrors, 'name')} />
        <AuthInput id="expert-register-email" label={tr('البريد الإلكتروني', 'Email address')} icon="mail" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearServerErrors(); }} placeholder="name@example.com" autoComplete="email" error={submitted ? (errors.email || getFirstFieldError(fieldErrors, 'email')) : getFirstFieldError(fieldErrors, 'email')} />
        <AuthInput id="expert-register-password" label={tr('كلمة المرور', 'Password')} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); clearServerErrors(); }} placeholder={tr('8 أحرف أو أكثر', '8 characters or more')} autoComplete="new-password" error={submitted ? (errors.password || getFirstFieldError(fieldErrors, 'password')) : getFirstFieldError(fieldErrors, 'password')} endAction={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((value) => !value)} label={showPassword ? tr('إخفاء كلمة المرور', 'Hide password') : tr('إظهار كلمة المرور', 'Show password')} />} />
        <AuthInput id="expert-register-confirm" label={tr('تأكيد كلمة المرور', 'Confirm password')} icon="lock" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); clearServerErrors(); }} placeholder={tr('أعد كتابة كلمة المرور', 'Re-enter your password')} autoComplete="new-password" error={submitted ? (errors.confirm || getFirstFieldError(fieldErrors, 'password_confirmation')) : getFirstFieldError(fieldErrors, 'password_confirmation')} endAction={<PasswordToggle visible={showConfirm} onClick={() => setShowConfirm((value) => !value)} label={showConfirm ? tr('إخفاء تأكيد كلمة المرور', 'Hide confirmation') : tr('إظهار تأكيد كلمة المرور', 'Show confirmation')} />} />
          </>
        ) : (
          <>
        <ExpertSelect id="expert-register-country" label={tr('بلد الممارسة', 'Country of practice')} icon="shield" value={country} onChange={(e) => { setCountry(e.target.value); clearServerErrors(); }} error={submitted ? (errors.country || getFirstFieldError(fieldErrors, 'country')) : getFirstFieldError(fieldErrors, 'country')}>
          <option value="">{tr('اختر البلد', 'Select a country')}</option>
          <option value="jo">{tr('الأردن', 'Jordan')}</option>
          <option value="ps">{tr('فلسطين', 'Palestine')}</option>
          <option value="us">{tr('الولايات المتحدة', 'United States')}</option>
          <option value="other">{tr('بلد آخر', 'Other country')}</option>
        </ExpertSelect>
        <ExpertSelect id="expert-register-language" label={tr('لغة العمل الأساسية', 'Primary working language')} icon="nodes" value={language} onChange={(e) => { setLanguage(e.target.value); clearServerErrors(); }} error={submitted ? (errors.language || getFirstFieldError(fieldErrors, 'language')) : getFirstFieldError(fieldErrors, 'language')}>
          <option value="">{tr('اختر اللغة', 'Select a language')}</option>
          <option value="ar">{tr('العربية', 'Arabic')}</option>
          <option value="en">English</option>
          <option value="ar-en">{tr('العربية وEnglish', 'Arabic and English')}</option>
        </ExpertSelect>
        <div className="auth-grid-span-2">
          <ExpertSelect id="expert-register-domain" label={tr('المجال المهني الرئيسي', 'Primary field')} icon="nodes" value={domain} onChange={(e) => { setDomain(e.target.value); clearServerErrors(); }} error={submitted ? (errors.domain || getFirstFieldError(fieldErrors, 'domain')) : getFirstFieldError(fieldErrors, 'domain')}>
            <option value="">{tr('اختر مجال خبرتك الرئيسي', 'Select your primary field')}</option>
            <option value="legal">{tr('قانون واستشارات قانونية', 'Law and legal advice')}</option>
            <option value="technology">{tr('تقنية وبرمجيات', 'Technology and software')}</option>
            <option value="finance">{tr('مالية ومحاسبة', 'Finance and accounting')}</option>
            <option value="business">{tr('أعمال وتشغيل', 'Business and operations')}</option>
            <option value="engineering">{tr('هندسة وعقار', 'Engineering and real estate')}</option>
            <option value="career">{tr('مسار مهني وموارد بشرية', 'Career and HR')}</option>
            <option value="other">{tr('مجال آخر', 'Other field')}</option>
          </ExpertSelect>
        </div>
          </>
        )}
      </div>

      {step === 1 && password && (
        <div className="auth-strength auth-strength" aria-label={tr('قوة كلمة المرور', 'Password strength')}>
          <div className="auth-strength__bars">{[1, 2, 3, 4].map((number) => <i key={number} className={number <= strength ? 'is-on' : ''}/>)}</div>
          <span>{strength <= 1 ? tr('ضعيفة', 'Weak') : strength === 2 ? tr('متوسطة', 'Fair') : strength === 3 ? tr('جيدة', 'Good') : tr('قوية', 'Strong')}</span>
        </div>
      )}

      {step === 2 && <div className="auth-declarations">
        <label className={`auth-check auth-check--terms ${submitted && errors.professionalDeclaration ? 'auth-check--error' : ''}`}>
          <input type="checkbox" checked={professionalDeclaration} onChange={(e) => setProfessionalDeclaration(e.target.checked)} />
          <span>{tr('أقر أن المعلومات المهنية ستخضع للتحقق وأن إنشاء الحساب لا يعني نشر ملفي أو اعتماد خدماتي.', 'I understand my professional details will be reviewed and account creation does not publish or approve my services.')}</span>
        </label>
        {submitted && errors.professionalDeclaration && <small className="auth-error">{errors.professionalDeclaration}</small>}

        <label className={`auth-check auth-check--terms ${submitted && errors.terms ? 'auth-check--error' : ''}`}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>{tr('أوافق على ', 'I agree to the ')}<Link to={PATHS.TERMS} target="_blank" rel="noopener noreferrer">{tr('الشروط والأحكام', 'Terms and Conditions')}</Link>{tr(' و', ' and ')}<Link to={PATHS.PRIVACY} target="_blank" rel="noopener noreferrer">{tr('سياسة الخصوصية', 'Privacy Policy')}</Link>.</span>
        </label>
        {submitted && errors.terms && <small className="auth-error">{errors.terms}</small>}
      </div>}

      <button className="auth-primary-btn auth-primary-btn" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {step === 1 ? <>{tr('متابعة ', 'Continue ')}<AuthIcon name="arrow" size={18}/></> : isSubmitting ? <><span className="auth-button-spinner" aria-hidden="true" /> {tr('جارٍ إنشاء الحساب...', 'Creating account...')}</> : <>{tr('إنشاء حساب الخبير ', 'Create expert account ')}<AuthIcon name="arrow" size={18}/></>}
      </button>
      {step === 2 && <button className="auth-motion-step-back" type="button" onClick={() => { setStep(1); setSubmitted(false); clearServerErrors(); }}>{tr('العودة إلى بيانات الحساب', 'Back to account details')}</button>}
      <p className="auth-switch auth-register-switch">{tr('لديك حساب خبير بالفعل؟ ', 'Already have an expert account? ')}<Link to={PATHS.EXPERT_LOGIN}>{tr('تسجيل الدخول', 'Sign in')}</Link></p>
    </form>
  );
}

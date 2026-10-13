import { EMAIL_PATTERN, getPasswordStrength } from '../../auth/utils/authValidation';

export { getPasswordStrength };

const say = (locale, ar, en) => locale === 'en' ? en : ar;

export function getExpertLoginErrors({ email, password }, locale = 'ar') {
  return {
    email: !email ? say(locale, 'أدخل بريدك الإلكتروني.', 'Enter your email address.') : (!EMAIL_PATTERN.test(email) ? say(locale, 'أدخل بريدًا إلكترونيًا صالحًا.', 'Enter a valid email address.') : ''),
    password: !password ? say(locale, 'أدخل كلمة المرور.', 'Enter your password.') : '',
  };
}

export function getExpertRegisterErrors({
  name,
  email,
  country,
  language,
  domain,
  password,
  confirm,
  terms,
  professionalDeclaration,
}, locale = 'ar') {
  return {
    name: !name.trim() ? say(locale, 'أدخل الاسم الكامل.', 'Enter your full name.') : '',
    email: !email ? say(locale, 'أدخل بريدك الإلكتروني.', 'Enter your email address.') : (!EMAIL_PATTERN.test(email) ? say(locale, 'أدخل بريدًا إلكترونيًا صالحًا.', 'Enter a valid email address.') : ''),
    country: !country ? say(locale, 'اختر بلد الممارسة.', 'Select your country of practice.') : '',
    language: !language ? say(locale, 'اختر لغة العمل الأساسية.', 'Select your working language.') : '',
    domain: !domain ? say(locale, 'اختر المجال المهني الرئيسي.', 'Select your primary field.') : '',
    password: !password ? say(locale, 'أنشئ كلمة مرور.', 'Create a password.') : (password.length < 8 ? say(locale, 'استخدم 8 أحرف على الأقل.', 'Use at least 8 characters.') : ''),
    confirm: !confirm ? say(locale, 'أعد كتابة كلمة المرور.', 'Confirm your password.') : (confirm !== password ? say(locale, 'كلمتا المرور غير متطابقتين.', 'Passwords do not match.') : ''),
    terms: !terms ? say(locale, 'يجب الموافقة على الشروط وسياسة الخصوصية.', 'Accept the terms and privacy policy.') : '',
    professionalDeclaration: !professionalDeclaration ? say(locale, 'يجب الإقرار بصحة المعلومات المهنية ومسار التحقق.', 'Confirm the professional information and verification process.') : '',
  };
}

export function getExpertForgotPasswordError(email) {
  if (!email) return 'أدخل بريدك الإلكتروني.';
  if (!EMAIL_PATTERN.test(email)) return 'أدخل بريدًا إلكترونيًا صالحًا.';
  return '';
}

export function getExpertResetPasswordErrors({ password, confirm }, locale = 'ar') {
  return {
    password: !password ? say(locale, 'أدخل كلمة المرور الجديدة.', 'Enter a new password.') : (password.length < 8 ? say(locale, 'استخدم 8 أحرف على الأقل.', 'Use at least 8 characters.') : ''),
    confirm: !confirm ? say(locale, 'أعد كتابة كلمة المرور.', 'Confirm your password.') : (confirm !== password ? say(locale, 'كلمتا المرور غير متطابقتين.', 'Passwords do not match.') : ''),
  };
}

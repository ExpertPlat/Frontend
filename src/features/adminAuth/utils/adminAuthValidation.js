import { EMAIL_PATTERN } from '../../auth/utils/authValidation';

export function getAdminLoginErrors({ email, password }, locale = 'ar') {
  if (locale === 'en') return {
    email: !email ? 'Enter your admin email.' : (!EMAIL_PATTERN.test(email) ? 'Enter a valid email address.' : ''),
    password: !password ? 'Enter your password.' : '',
  };
  return {
    email: !email ? 'أدخل البريد الإلكتروني الإداري.' : (!EMAIL_PATTERN.test(email) ? 'أدخل بريدًا إلكترونيًا صالحًا.' : ''),
    password: !password ? 'أدخل كلمة المرور.' : '',
  };
}

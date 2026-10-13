export const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const say = (locale, ar, en) => locale === 'en' ? en : ar;

export function getLoginErrors({ email, password }, locale = 'ar') {
  return {
    email: !email ? say(locale, 'أدخل بريدك الإلكتروني.', 'Enter your email address.') : (!EMAIL_PATTERN.test(email) ? say(locale, 'أدخل بريدًا إلكترونيًا صالحًا.', 'Enter a valid email address.') : ''),
    password: !password ? say(locale, 'أدخل كلمة المرور.', 'Enter your password.') : '',
  };
}

export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Zأ-ي]/.test(password) && /[a-zأ-ي]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9أ-ي]/.test(password)) score += 1;
  return score;
}

export function getRegisterErrors({ name, email, password, confirm, terms }, locale = 'ar') {
  return {
    name: !name.trim() ? say(locale, 'أدخل الاسم الكامل.', 'Enter your full name.') : '',
    email: !email ? say(locale, 'أدخل بريدك الإلكتروني.', 'Enter your email address.') : (!EMAIL_PATTERN.test(email) ? say(locale, 'أدخل بريدًا إلكترونيًا صالحًا.', 'Enter a valid email address.') : ''),
    password: !password ? say(locale, 'أنشئ كلمة مرور.', 'Create a password.') : (password.length < 8 ? say(locale, 'استخدم 8 أحرف على الأقل.', 'Use at least 8 characters.') : ''),
    confirm: !confirm ? say(locale, 'أعد كتابة كلمة المرور.', 'Confirm your password.') : (confirm !== password ? say(locale, 'كلمتا المرور غير متطابقتين.', 'Passwords do not match.') : ''),
    terms: !terms ? say(locale, 'يجب الموافقة على الشروط وسياسة الخصوصية.', 'Accept the terms and privacy policy.') : '',
  };
}


export function getForgotPasswordError(email, locale = 'ar') {
  if (!email) return say(locale, 'أدخل بريدك الإلكتروني.', 'Enter your email address.');
  if (!EMAIL_PATTERN.test(email)) return say(locale, 'أدخل بريدًا إلكترونيًا صالحًا.', 'Enter a valid email address.');
  return '';
}

export function getResetPasswordErrors({ password, confirm }, locale = 'ar') {
  return {
    password: !password ? say(locale, 'أدخل كلمة المرور الجديدة.', 'Enter a new password.') : (password.length < 8 ? say(locale, 'استخدم 8 أحرف على الأقل.', 'Use at least 8 characters.') : ''),
    confirm: !confirm ? say(locale, 'أعد كتابة كلمة المرور.', 'Confirm your password.') : (confirm !== password ? say(locale, 'كلمتا المرور غير متطابقتين.', 'Passwords do not match.') : ''),
  };
}

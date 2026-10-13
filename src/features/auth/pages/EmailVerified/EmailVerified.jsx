import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthIcon from '../../components/AuthIcon/AuthIcon';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';

export default function EmailVerified() {
  const location = useLocation();
  const { locale, tr } = useLocale();
  const message = (locale === 'en' ? '' : location.state?.message) || tr('تم تأكيد وسيلة التواصل المرتبطة بحسابك. يمكنك الآن تسجيل الدخول والوصول إلى حالاتك ومساحة عملك.', 'Your email is verified. Sign in to access your cases and workspace.');

  return (
    <div className="auth-form auth-state-card auth-state-card--verified">
      <div className="auth-success-ring" aria-hidden="true">
        <span><AuthIcon name="check" size={36}/></span>
        <i/><i/><i/>
      </div>
      <span className="auth-kicker">{tr('تم التحقق بنجاح', 'Verified successfully')}</span>
      <h1>{tr('تم تأكيد بريدك الإلكتروني', 'Your email is verified')}</h1>
      <p>{message}</p>

      <div className="auth-next-step">
        <span><AuthIcon name="nodes" size={19}/></span>
        <div><b>{tr('الخطوة التالية', 'Next step')}</b><small>{tr('سجّل الدخول، ثم ابدأ حالة جديدة أو تابع الحالات والاستشارات الموجودة في حسابك.', 'Sign in to start a case or follow your existing cases and consultations.')}</small></div>
      </div>

      <Link className="auth-primary-btn" to={PATHS.LOGIN}>{tr('الانتقال إلى تسجيل الدخول ', 'Continue to sign in ')}<AuthIcon name="arrow" size={18}/></Link>
      <Link className="auth-inline-link" to={PATHS.HOME}>{tr('العودة إلى الصفحة الرئيسية', 'Back to home')}</Link>
    </div>
  );
}

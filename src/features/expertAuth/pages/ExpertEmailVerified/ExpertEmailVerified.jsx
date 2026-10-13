import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthIcon from '../../../auth/components/AuthIcon/AuthIcon';
import { PATHS } from '../../../../routes/paths';
import { useLocale } from '../../../../context/LocaleContext';
import useAuth from '../../../../hooks/useAuth';

export default function ExpertEmailVerified() {
  const location = useLocation();
  const { locale, tr } = useLocale();
  const { sessions } = useAuth();
  const continuePath = sessions.expert?.isAuthenticated && sessions.expert?.emailVerified
    ? PATHS.EXPERT_DASHBOARD
    : PATHS.EXPERT_LOGIN;
  const message = (locale === 'en' ? '' : location.state?.message) || tr('أصبحت وسيلة التواصل مؤكدة. يمكنك الآن تسجيل الدخول ومتابعة إعداد دورك المهني ومسار التحقق من الخبرة.', 'Your email is verified. Sign in to complete your expert profile and verification.');

  return (
    <div className="auth-form auth-form auth-state-card auth-state-card--verified">
      <div className="auth-success-ring" aria-hidden="true">
        <span><AuthIcon name="check" size={36}/></span>
        <i/><i/><i/>
      </div>
      <span className="auth-kicker">{tr('تم التحقق بنجاح', 'Verified successfully')}</span>
      <h1>{tr('تم تأكيد بريدك الإلكتروني', 'Your email is verified')}</h1>
      <p>{message}</p>

      <div className="auth-next-step">
        <span><AuthIcon name="nodes" size={19}/></span>
        <div><b>{tr('الخطوة التالية', 'Next step')}</b><small>{tr('استكمال معلومات الخبرة والمؤهلات والنطاق قبل نشر الملف المهني.', 'Complete your expertise and qualifications before publishing your profile.')}</small></div>
      </div>

      <Link className="auth-primary-btn auth-primary-btn" to={continuePath}>{sessions.expert?.isAuthenticated && sessions.expert?.emailVerified ? tr('الانتقال إلى مساحة الخبير ', 'Continue to expert workspace ') : tr('الانتقال إلى تسجيل دخول الخبير ', 'Continue to expert sign in ')}<AuthIcon name="arrow" size={18}/></Link>
      <Link className="auth-inline-link" to={PATHS.HOME}>{tr('العودة إلى الصفحة الرئيسية', 'Back to home')}</Link>
    </div>
  );
}

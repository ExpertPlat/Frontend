import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Icon from '../Icon/Icon';
import './Footer.css';
import { PATHS } from '../../routes/paths';
import { useLocale } from '../../context/LocaleContext';

export default function Footer() {
  const { tr } = useLocale();
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'support@solveit.com';
  return (
    <footer className="lp-footer">
      <div className="container lp-footer__grid">
        <div className="lp-footer__brand">
          <Logo tone="light" className="lp-footer__logo" />
          <p>{tr('منصة تجمع المشكلة والخبرات والمعلومات ضمن حالة واحدة وسياق واضح.', 'A single place for your question, the right experts, and the information that matters.')}</p>
          <b>{tr('مشكلة واحدة. خبرات تعمل معًا.', 'One problem. Experts working together.')}</b>
          <span className="lp-footer__remote"><Icon name="video" size={16} />{tr('جميع الخدمات عن بُعد', 'All services are remote')}</span>
        </div>
        <nav className="lp-footer__links" aria-label={tr('المنصة', 'Platform')}>
          <h4>{tr('المنصة', 'Platform')}</h4>
          <a href="/#how">{tr('كيف تعمل', 'How it works')}</a>
          <a href="/#services">{tr('داخل الحالة', 'Inside a case')}</a>
          <a href="/#experts">{tr('الخبراء', 'Experts')}</a>
          <a href="/#faq">{tr('الأسئلة الشائعة', 'FAQ')}</a>
        </nav>
        <nav className="lp-footer__links" aria-label={tr('ابدأ', 'Get started')}>
          <h4>{tr('ابدأ', 'Get started')}</h4>
          <Link to={PATHS.REGISTER}>{tr('إنشاء حساب', 'Create an account')}</Link>
          <Link to={PATHS.LOGIN}>{tr('تسجيل الدخول', 'Sign in')}</Link>
          <Link to={PATHS.EXPERT_REGISTER}>{tr('انضم كخبير', 'Join as expert')}</Link>
        </nav>
        <nav className="lp-footer__links" aria-label={tr('تواصل', 'Contact')}>
          <h4>{tr('تواصل وقانوني', 'Contact & legal')}</h4>
          <a href={`mailto:${supportEmail}`}>{tr('تواصل معنا', 'Contact us')}</a>
          <Link to={PATHS.PRIVACY}>{tr('الخصوصية', 'Privacy')}</Link>
          <Link to={PATHS.TERMS}>{tr('الشروط', 'Terms')}</Link>
        </nav>
      </div>
      <div className="container lp-footer__bottom"><span>© 2026 SolveIt</span><span>{tr('خبرة موثوقة ضمن سياق واحد واضح', 'Trusted expertise, one clear context')}</span></div>
    </footer>
  );
}

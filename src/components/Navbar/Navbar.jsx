import { Link } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import Logo from '../Logo/Logo';
import Icon from '../Icon/Icon';
import './Navbar.css';
import { PATHS } from '../../routes/paths';
import useAuth from '../../hooks/useAuth';
import LocaleSwitch from '../LocaleSwitch/LocaleSwitch';
import { useLocale } from '../../context/LocaleContext';

const SESSION_DESTINATIONS = Object.freeze({
  user: { path: PATHS.USER_DASHBOARD, ar: 'لوحة المستخدم', en: 'User dashboard' },
  expert: { path: PATHS.EXPERT_DASHBOARD, ar: 'لوحة الخبير', en: 'Expert dashboard' },
  admin: { path: PATHS.ADMIN_DASHBOARD, ar: 'لوحة الإدارة', en: 'Admin dashboard' },
});

const SECTIONS = [
  { id: 'top', ar: 'الرئيسية', en: 'Home' },
  { id: 'how', ar: 'كيف تعمل', en: 'How it works' },
  { id: 'services', ar: 'داخل الحالة', en: 'Inside a case' },
  { id: 'experts', ar: 'الخبراء', en: 'Experts' },
  { id: 'faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
];

export default function Navbar() {
  const { tr } = useLocale();
  const { sessions } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState('top');
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 16);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  // Scroll-spy: highlight the section that crosses the upper third of the viewport.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') { setOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('lp-no-scroll');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('lp-no-scroll'); };
  }, [open]);

  const activeType = ['user', 'expert', 'admin'].find((type) => sessions[type]?.isAuthenticated);
  const activeSession = activeType ? sessions[activeType] : null;
  const destination = activeType ? SESSION_DESTINATIONS[activeType] : null;
  const displayName = activeSession?.account?.name || activeSession?.account?.full_name || activeSession?.account?.fullName || tr('حسابي', 'My account');
  const close = () => setOpen(false);

  const links = SECTIONS.map((section) => (
    <a key={section.id} href={`#${section.id}`} className={active === section.id ? 'is-active' : ''} aria-current={active === section.id ? 'true' : undefined} onClick={close}>{tr(section.ar, section.en)}</a>
  ));

  const actions = destination ? (
    <>
      <span className="lp-nav__session"><small>{tr('مرحبًا', 'Welcome')}</small><b>{displayName}</b></span>
      <Link className="lp-btn lp-btn--primary" to={destination.path} onClick={close}>{tr(destination.ar, destination.en)}</Link>
    </>
  ) : (
    <>
      <Link className="lp-btn lp-btn--ghost" to={PATHS.LOGIN} onClick={close}>{tr('تسجيل الدخول', 'Sign in')}</Link>
      <Link className="lp-btn lp-btn--primary" to={PATHS.EXPERT_REGISTER} onClick={close}>{tr('ابدأ كخبير', 'Join as an expert')}</Link>
    </>
  );

  return (
    <header className={`lp-nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="lp-nav__inner container">
        <Logo className="lp-nav__logo" />
        <nav className="lp-nav__links" aria-label={tr('التنقل الرئيسي', 'Main navigation')}>{links}</nav>
        <div className="lp-nav__actions">
          <LocaleSwitch />
          <div className="lp-nav__cta">{actions}</div>
          <button ref={menuButtonRef} type="button" className="lp-nav__toggle" aria-expanded={open} aria-controls="lp-nav-drawer" aria-label={open ? tr('إغلاق القائمة', 'Close menu') : tr('فتح القائمة', 'Open menu')} onClick={() => setOpen((value) => !value)}>
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
        <span className="lp-nav__progress" style={{ transform: `scaleX(${progress})`, opacity: progress > 0.005 ? 1 : 0 }} aria-hidden="true" />
      </div>

      <div className="lp-nav__scrim" onClick={close} aria-hidden="true" />
      <div id="lp-nav-drawer" className="lp-nav__drawer" hidden={!open}>
        <nav className="lp-nav__drawer-links" aria-label={tr('القائمة', 'Menu')}>{links}</nav>
        <div className="lp-nav__drawer-cta">
          {actions}
        </div>
      </div>
    </header>
  );
}

import React, { useLayoutEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Logo, { LogoImage } from '../../../../components/Logo/Logo';
import LocaleSwitch from '../../../../components/LocaleSwitch/LocaleSwitch';
import { useLocale } from '../../../../context/LocaleContext';
import { PATHS } from '../../../../routes/paths';
import AuthIcon from '../AuthIcon/AuthIcon';
import { AUTH_COPY, FOOTER_NOTE, MODE_BY_PATH, VERIFY_PREFIX } from './authCopy';
import '../../authKit.css';

const ACCOUNT_LABEL = {
  user: { ar: 'مستخدم', en: 'User' },
  expert: { ar: 'خبير', en: 'Expert' },
  admin: { ar: 'إدارة', en: 'Admin' },
};

function useAuthMode(account) {
  const { pathname } = useLocation();
  const normalized = pathname.replace(/\/+$/, '') || PATHS.HOME;
  const prefix = VERIFY_PREFIX[account];
  if (prefix && normalized.startsWith(`${prefix}/`)) return 'verify';
  return MODE_BY_PATH[account][normalized] || 'login';
}

const BrandPanel = React.forwardRef(function BrandPanel({ account, mode }, ref) {
  const { locale, tr } = useLocale();
  const copy = AUTH_COPY[account];
  const content = copy.modes[mode] || copy.modes.login;
  const t = (item) => item[locale === 'en' ? 'en' : 'ar'];

  return (
    <aside className="auth-brand" ref={ref} aria-label={tr('عن SolveIt', 'About SolveIt')}>
      <div className="auth-brand__glow" aria-hidden="true" />
      <LogoImage variant="mark" tone="light" className="auth-brand__watermark" alt="" />
      <div className="auth-brand__inner" key={`${account}-${mode}-${locale}`}>
        <span className="auth-brand__eyebrow"><i aria-hidden="true" />{t(content.eyebrow)}</span>
        <h2>{t(content.title)}</h2>
        <p>{t(content.text)}</p>
        <ul className="auth-brand__points">
          {copy.points.map((point) => (
            <li key={point.en}><span aria-hidden="true"><AuthIcon name="check" size={14} /></span>{t(point)}</li>
          ))}
        </ul>
        {content.to && (
          <Link className="auth-brand__cta" to={content.to}>
            {t(content.cta)}<AuthIcon name="arrow" size={17} />
          </Link>
        )}
      </div>
    </aside>
  );
});

/**
 * Shared frame for every sign-in / sign-up / recovery screen.
 * account: 'user' | 'expert' | 'admin' — drives theme, copy and routes.
 */
export default function AuthFrame({ account }) {
  const { dir, locale, tr } = useLocale();
  const mode = useAuthMode(account);
  const { pathname } = useLocation();
  // Sign-in and sign-up sit on opposite sides: moving between them swaps the two panels.
  const flipped = mode === 'register';
  const formRef = useRef(null);
  const brandRef = useRef(null);
  const previous = useRef(null);

  useLayoutEffect(() => {
    const form = formRef.current;
    const brand = brandRef.current;
    if (!form || !brand) return undefined;
    const rects = { form: form.getBoundingClientRect(), brand: brand.getBoundingClientRect() };
    const before = previous.current;
    previous.current = { flipped, rects };
    if (!before || before.flipped === flipped) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const animations = [[form, before.rects.form, rects.form, 3], [brand, before.rects.brand, rects.brand, 2]].flatMap(([node, from, to, layer]) => {
      const dx = from.left - to.left;
      if (!dx || !node.animate) return [];
      node.style.zIndex = layer;
      return [node.animate(
        [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
        { duration: 720, easing: 'cubic-bezier(0.65, 0, 0.2, 1)' },
      )];
    });
    const finish = () => { form.style.zIndex = ''; brand.style.zIndex = ''; };
    Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
    return () => animations.forEach((animation) => animation.cancel());
  }, [flipped, dir]);
  const footer = FOOTER_NOTE[account];
  const label = ACCOUNT_LABEL[account];

  return (
    <main className={`auth-page auth-page--${account} auth-page--${mode}`} dir={dir} data-auth-account={account} data-auth-mode={mode}>
      <div className={`auth-shell${flipped ? ' is-flipped' : ''}`}>
        <section className="auth-form-panel" ref={formRef}>
          <header className="auth-form-panel__top">
            <Logo variant="wordmark" label={tr('العودة إلى الرئيسية', 'Back to home')} />
            <div className="auth-header-tools">
              <span className="auth-account-chip">{label[locale === 'en' ? 'en' : 'ar']}</span>
              <LocaleSwitch />
              <Link className="auth-back" to={PATHS.HOME}>
                <AuthIcon name="arrow" size={16} />
                <span>{tr('الرئيسية', 'Home')}</span>
              </Link>
            </div>
          </header>
          <div className="auth-form-panel__body" key={pathname}>
            <Outlet />
          </div>
          <footer className="auth-form-panel__footer">
            <AuthIcon name="shield" size={15} />
            <span>{footer[locale === 'en' ? 'en' : 'ar']}</span>
          </footer>
        </section>
        <BrandPanel ref={brandRef} account={account} mode={mode} />
      </div>
    </main>
  );
}

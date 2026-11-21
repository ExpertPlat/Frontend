import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo, { LogoImage } from '../../../../components/Logo/Logo';
import LocaleSwitch from '../../../../components/LocaleSwitch/LocaleSwitch';
import ThemeToggle from '../../../../components/ThemeToggle/ThemeToggle';
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

/* "Focal lens" swap timings (ms). Keep in sync with the stage transitions in authKit.css. */
const COVER_MS = 560;   // the panel closes over the whole card
const FOCUS_MS = 160;   // the lens holds at the centre while the new screen mounts underneath
const REVEAL_MS = 980;  // the panel opens toward the other side and the new fields arrive

function modeOf(account, pathname) {
  const normalized = pathname.replace(/\/+$/, '') || PATHS.HOME;
  const prefix = VERIFY_PREFIX[account];
  if (prefix && normalized.startsWith(`${prefix}/`)) return 'verify';
  return MODE_BY_PATH[account][normalized] || null;
}

function useAuthMode(account) {
  const { pathname } = useLocation();
  return modeOf(account, pathname) || 'login';
}

const isFlippedMode = (mode) => mode === 'register';

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const splitLayout = () => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 921px)').matches;

const BrandPanel = React.forwardRef(function BrandPanel({ account, mode, swapIn }, ref) {
  const { locale, tr } = useLocale();
  const copy = AUTH_COPY[account];
  const content = copy.modes[mode] || copy.modes.login;
  const t = (item) => item[locale === 'en' ? 'en' : 'ar'];

  return (
    <aside className="auth-brand" ref={ref} aria-label={tr('عن SolveIt', 'About SolveIt')}>
      {/* The lens only shows while the panel covers the whole card during a swap. */}
      <div className="auth-brand__lens" aria-hidden="true">
        <span className="auth-brand__lens-rings" />
        <span className="auth-brand__lens-core"><LogoImage variant="mark" tone="light" alt="" /></span>
      </div>
      <div className="auth-brand__side">
        <div className="auth-brand__glow" aria-hidden="true" />
        <LogoImage variant="mark" tone="light" className="auth-brand__watermark" alt="" />
        <div className={`auth-brand__inner${swapIn ? ' is-swap-in' : ''}`} key={`${account}-${mode}-${locale}`}>
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
      </div>
    </aside>
  );
});

/**
 * Shared frame for every sign-in / sign-up / recovery screen.
 * account: 'user' | 'expert' | 'admin' — drives theme, copy and routes.
 *
 * Sign-in and sign-up sit on opposite sides of one card. Moving between them plays the "focal lens"
 * swap: the brand panel closes over the card (cover), the lens focuses at the centre while the new
 * route mounts underneath (focus), then the panel opens toward the other side with its curve flipped
 * and the new fields arrive one by one (reveal). Routes, forms and auth logic are unchanged; the link
 * navigation is only delayed until the card is covered.
 */
export default function AuthFrame({ account }) {
  const { dir, locale, tr } = useLocale();
  const mode = useAuthMode(account);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const flipped = isFlippedMode(mode);
  const [stage, setStage] = useState('idle'); // idle | covering | covered | revealing
  const stageRef = useRef('idle');
  const timers = useRef([]);
  const previousFlipped = useRef(flipped);

  const go = useCallback((next) => { stageRef.current = next; setStage(next); }, []);
  const later = useCallback((fn, ms) => { timers.current.push(window.setTimeout(fn, ms)); }, []);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  // Intercept links that move to the other side of the card (sign in <-> sign up).
  const onClickCapture = useCallback((event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target === '_blank') return;
    const url = new URL(anchor.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) return;
    const targetMode = modeOf(account, url.pathname);
    if (!targetMode || isFlippedMode(targetMode) === flipped) return;
    if (stageRef.current !== 'idle') { event.preventDefault(); return; }
    if (reducedMotion() || !splitLayout()) return; // plain navigation; the new screen simply rises in
    event.preventDefault();
    go('covering');
    later(() => {
      go('covered');
      navigate(`${url.pathname}${url.search}${url.hash}`);
      // Safety net: if the route did not change sides (e.g. a guard redirected), open the card again.
      later(() => {
        if (stageRef.current !== 'covered') return;
        go('revealing');
        later(() => go('idle'), REVEAL_MS);
      }, FOCUS_MS + 600);
    }, COVER_MS);
  }, [account, flipped, go, later, navigate]);

  // After the route changed sides: open the lens toward the new side.
  useLayoutEffect(() => {
    if (previousFlipped.current === flipped) return;
    previousFlipped.current = flipped;
    if (reducedMotion()) { go('idle'); return; }
    if (stageRef.current === 'covered') {
      later(() => {
        go('revealing');
        later(() => go('idle'), REVEAL_MS);
      }, FOCUS_MS);
      return;
    }
    // Back/forward navigation: no cover phase, the panel sweeps straight across.
    go('revealing');
    later(() => go('idle'), REVEAL_MS);
  }, [flipped, go, later]);

  // Content mounted under the closed card gets a one-time line-by-line entrance timed to the reveal.
  // Fixed per mount, so later stage changes never restart an animation.
  const formSwapIn = useMemo(() => stageRef.current === 'covered', [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const brandSwapIn = useMemo(() => stageRef.current === 'covered', [mode, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const footer = FOOTER_NOTE[account];
  const label = ACCOUNT_LABEL[account];
  const busy = stage !== 'idle';

  return (
    <main
      className={`auth-page auth-page--${account} auth-page--${mode}`}
      dir={dir}
      data-auth-account={account}
      data-auth-mode={mode}
      onClickCapture={onClickCapture}
    >
      <header className="auth-topbar">
        <Logo variant="wordmark" label={tr('العودة إلى الرئيسية', 'Back to home')} />
        <div className="auth-header-tools">
          <span className="auth-account-chip">{label[locale === 'en' ? 'en' : 'ar']}</span>
          <ThemeToggle />
          <LocaleSwitch />
          <Link className="auth-back" to={PATHS.HOME}>
            <AuthIcon name="arrow" size={16} />
            <span>{tr('الرئيسية', 'Home')}</span>
          </Link>
        </div>
      </header>

      <div className={`auth-card${flipped ? ' is-flipped' : ''}${busy ? ` is-${stage}` : ''}`} aria-busy={busy || undefined}>
        <section className="auth-form-panel">
          <div className={`auth-form-panel__body${formSwapIn ? ' is-swap-in' : ''}`} key={pathname}>
            <Outlet />
          </div>
        </section>
        <BrandPanel account={account} mode={mode} swapIn={brandSwapIn} />
      </div>

      <footer className="auth-form-panel__footer">
        <AuthIcon name="shield" size={15} />
        <span>{footer[locale === 'en' ? 'en' : 'ar']}</span>
      </footer>
    </main>
  );
}

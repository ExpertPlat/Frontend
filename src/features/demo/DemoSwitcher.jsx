import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_ACCOUNTS, DEMO_MODE } from './demoConfig';
import useDemoSwitch from './useDemoSwitch';
import useDashboardDark from './useDashboardDark';
import DemoIcon from './icons';
import DemoTour from './DemoTour';
import { JourneySteps } from './tourContent';
import { replayBestTour } from './tourRegistry';
import './demo.css';

const ROLES = [['user', 'صاحب حالة', 'Client'], ['expert', 'خبير', 'Expert'], ['admin', 'إدارة', 'Admin']];
const OPEN = 'solveit:demo-switch-open';
const CLOSE = 'solveit:demo-switch-close';

function roleFromPath(pathname) {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/expert')) return 'expert';
  return 'user';
}

/** Floating "Switch account" control, mounted once in App. Only exists in demo mode. */
export default function DemoSwitcher() {
  const { tr, locale } = useLocale();
  const { pathname } = useLocation();
  const switchTo = useDemoSwitch();
  const dark = useDashboardDark();
  const [open, setOpen] = useState(false);
  const current = roleFromPath(pathname);
  const [role, setRole] = useState(current === 'user' ? 'expert' : 'user');
  const wrap = useRef(null);

  useEffect(() => { setRole(current === 'user' ? 'expert' : 'user'); }, [current]);

  useEffect(() => {
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    window.addEventListener(OPEN, show);
    window.addEventListener(CLOSE, hide);
    return () => { window.removeEventListener(OPEN, show); window.removeEventListener(CLOSE, hide); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!wrap.current?.contains(e.target) && !e.target.closest?.('.st')) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape' && !document.querySelector('.st')) setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const steps = useMemo(() => [
    {
      target: '[data-tour="demo-switch"]',
      title: { ar: 'زر «بدّل الحساب»: مفتاح التجربة الكاملة', en: '"Switch account": the key to the full experience' },
      body: {
        ar: 'المنصة تجمع ثلاثة أطراف، وكل طرف يرى جانباً مختلفاً من الحالة نفسها. من هذا الزر تنتقل بينهم دون تسجيل خروج يدوي، لتجرّب دورة كاملة هكذا:',
        en: 'The platform brings three parties together, each seeing a different side of the same case. This button moves you between them without signing out by hand, so you can run a full cycle:',
      },
      extra: <JourneySteps />,
      placement: 'top',
      onEnter: () => window.dispatchEvent(new Event(CLOSE)),
    },
    {
      target: '[data-tour="demo-switch-menu"]',
      onEnter: () => window.dispatchEvent(new Event(OPEN)),
      title: { ar: 'اختر الدور ثم الحساب', en: 'Pick a role, then an account' },
      body: {
        ar: ['اختر التبويب ثم الحساب. نخرجك من الحساب الحالي لهذا الدور، ونفتح صفحة دخوله والبيانات معبّأة، فلا يبقى إلا «تسجيل الدخول».', 'هذا الزر موجود لأغراض التجربة فقط. عند الإطلاق الفعلي لن يظهر، وسيعمل كل مستخدم بحسابه وضمن دوره.'],
        en: ['Choose a tab, then an account. We sign you out of that role and open its sign-in page already filled in — just press Sign in.', 'This button exists for the trial only. At launch it disappears and everyone works with their own account and role.'],
      },
    },
    {
      target: '[data-tour="demo-switch-replay"]',
      onEnter: () => window.dispatchEvent(new Event(OPEN)),
      title: { ar: 'يمكنك إعادة الجولة متى شئت', en: 'Replay this tour any time' },
      body: { ar: 'إذا احتجت التذكير لاحقاً، افتح هذه القائمة واضغط هنا.', en: 'If you need a reminder later, open this menu and press here.' },
      finish: { ar: 'تم', en: 'Done' },
    },
  ], []);

  const closeMenu = useCallback(() => window.dispatchEvent(new Event(CLOSE)), []);
  if (!DEMO_MODE) return null;
  const onLogin = /\/login$/.test(pathname);
  const go = (email) => { setOpen(false); switchTo(role, email); };

  return (
    <div className={`demo-switcher${dark ? ' is-dark' : ''}`} ref={wrap}>
      {open && (
        <div className="demo-switcher__menu" data-tour="demo-switch-menu" role="dialog" aria-label={tr('تبديل الحساب', 'Switch account')}>
          <div className="demo-switcher__head">
            <b>{tr('تبديل الحساب', 'Switch account')}</b>
            <small>{tr('اختر الدور ثم الحساب', 'Pick a role, then an account')}</small>
          </div>
          <div className="demo-switcher__tabs" role="tablist">
            {ROLES.map(([r, ar, en]) => (
              <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'is-on' : ''} onClick={() => setRole(r)}>
                {tr(ar, en)}{r === current && !onLogin && <i aria-label={tr('الدور الحالي', 'current role')} />}
              </button>
            ))}
          </div>
          <ul>
            {DEMO_ACCOUNTS[role].map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => go(a.email)}>
                  <span className="demo-switcher__avatar" aria-hidden="true">{a.name[locale].trim().charAt(0)}</span>
                  <span><b>{a.name[locale]}</b><small>{a.role[locale]}</small></span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="demo-switcher__replay" data-tour="demo-switch-replay" onClick={() => { setOpen(false); replayBestTour(); }}>
            <DemoIcon name="replay" size={15} />{tr('عرض الجولة التعريفية', 'Show the walkthrough')}
          </button>
        </div>
      )}
      <button type="button" className="demo-switcher__fab" data-tour="demo-switch" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <DemoIcon name="swap" size={17} />
        <span>{tr('بدّل الحساب', 'Switch account')}</span>
      </button>
      {!onLogin && <DemoTour id="switcher" steps={steps} priority={1} delay={900} onClose={closeMenu} />}
    </div>
  );
}

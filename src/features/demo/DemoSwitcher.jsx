import React, { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_ACCOUNTS, DEMO_MODE } from './demoConfig';
import useDemoSwitch from './useDemoSwitch';
import './demo.css';

const ROLES = [['user', 'مستخدم', 'User'], ['expert', 'خبير', 'Expert'], ['admin', 'إدارة', 'Admin']];

/** Floating "switch account" pill, mounted once in App. Only exists in demo mode. */
export default function DemoSwitcher() {
  const { tr, locale } = useLocale();
  const switchTo = useDemoSwitch();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('expert');
  if (!DEMO_MODE) return null;
  const go = (email) => { setOpen(false); switchTo(role, email); };
  return (
    <div className="demo-switcher">
      {open && (
        <div className="demo-switcher__menu" role="dialog" aria-label={tr('تبديل الحساب التجريبي', 'Switch demo account')}>
          <div className="demo-switcher__tabs" role="tablist">
            {ROLES.map(([r, ar, en]) => <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'is-on' : ''} onClick={() => setRole(r)}>{tr(ar, en)}</button>)}
          </div>
          <ul>
            {DEMO_ACCOUNTS[role].map((a) => <li key={a.email}><button type="button" onClick={() => go(a.email)}><b>{a.name[locale]}</b><small>{a.role[locale]}</small></button></li>)}
          </ul>
          <p>{tr('للتجربة فقط — عند النشر يعمل كل مستخدم بحسابه وحسب دوره.', 'For testing only — at launch each person works with their own account and role.')}</p>
        </div>
      )}
      <button type="button" className="demo-switcher__fab" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="demo-badge"><i aria-hidden="true" />{tr('تجريبي', 'Demo')}</span>{tr('بدّل الحساب', 'Switch account')}
      </button>
    </div>
  );
}

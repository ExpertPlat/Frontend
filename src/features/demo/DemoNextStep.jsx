import React, { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_MODE } from './demoConfig';
import useDemoSwitch from './useDemoSwitch';
import './demo.css';

/**
 * "Where do I go next?" card for the trial. Rendered only in demo mode.
 * actions: [{ role: 'user'|'expert'|'admin', email?, label: {ar,en} }] — each is a link to that role's login with the
 * demo account pre-filled. `to` can be used instead for an in-app link.
 */
export default function DemoNextStep({ id, title, body, actions = [] }) {
  const { tr, locale } = useLocale();
  const switchTo = useDemoSwitch();
  const key = `solveit-demo-next-${id}`;
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } });
  if (!DEMO_MODE || hidden) return null;
  const dismiss = () => { setHidden(true); try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ } };
  return (
    <section className="demo-next" role="note">
      <div className="demo-next__head">
        <span className="demo-badge"><i aria-hidden="true" />{tr('تجريبي', 'Demo')}</span>
        <b>{title[locale]}</b>
        <button type="button" className="demo-next__close" onClick={dismiss} aria-label={tr('إخفاء', 'Dismiss')}>×</button>
      </div>
      <p>{body[locale]}</p>
      {actions.length > 0 && (
        <div className="demo-next__actions">
          {actions.map((a) => (
            <button key={`${a.role}-${a.email || a.to}`} type="button" className="demo-btn" onClick={() => switchTo(a.role, a.email)}>{a.label[locale]} {locale === 'ar' ? '←' : '→'}</button>
          ))}
        </div>
      )}
      <small>{tr('هذا التوجيه للتجربة فقط؛ عند النشر يكمل كل مستخدم عمله حسب دوره.', 'This guidance is for the trial only; at launch everyone continues within their own role.')}</small>
    </section>
  );
}

import React, { useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_MODE } from './demoConfig';
import useDemoSwitch from './useDemoSwitch';
import DemoIcon from './icons';
import './demo.css';

/**
 * "Where do I go next?" card, rendered only in demo mode.
 * actions: [{ role: 'user'|'expert'|'admin', email?, label: {ar,en} }] — each signs out that role and opens its
 * sign-in page with the account pre-filled.
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
        <DemoIcon name="swap" size={18} />
        <b>{title[locale]}</b>
        <button type="button" className="demo-next__close" onClick={dismiss} aria-label={tr('إخفاء', 'Dismiss')}><DemoIcon name="close" size={16} /></button>
      </div>
      <p>{body[locale]}</p>
      {actions.length > 0 && (
        <div className="demo-next__actions">
          {actions.map((a) => (
            <button key={`${a.role}-${a.email || 'login'}`} type="button" className="demo-btn" onClick={() => switchTo(a.role, a.email)}>{a.label[locale]}</button>
          ))}
        </div>
      )}
    </section>
  );
}

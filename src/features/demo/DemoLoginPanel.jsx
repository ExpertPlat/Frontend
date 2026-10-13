import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD, ROLE_LOGIN_PATH, findDemoAccount } from './demoConfig';
import DemoWelcomeModal, { demoWelcomeSeen } from './DemoWelcomeModal';
import './demo.css';

const ROLE_LABEL = { user: ['مستخدم', 'User'], expert: ['خبير', 'Expert'], admin: ['إدارة', 'Admin'] };

/**
 * Trial shortcut on every login page: one button fills the demo credentials, a list lets you pick another account,
 * and a first-visit walkthrough explains why it exists. `onFill({email, password})` sets the form fields.
 * Reads ?demo=<email> so "go to X's login" links arrive pre-filled.
 */
export default function DemoLoginPanel({ role, onFill }) {
  const { tr, locale } = useLocale();
  const [params] = useSearchParams();
  const accounts = DEMO_ACCOUNTS[role] || [];
  const [selected, setSelected] = useState(accounts[0]?.email);
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [filled, setFilled] = useState('');
  const fillRef = useRef(onFill);
  fillRef.current = onFill;

  const fill = (email) => {
    setSelected(email);
    setFilled(email);
    fillRef.current?.({ email, password: DEMO_PASSWORD });
  };

  useEffect(() => {
    if (!DEMO_MODE) return;
    const wanted = findDemoAccount(role, params.get('demo'));
    if (wanted) fill(wanted.email);
    else if (!demoWelcomeSeen()) setHelp(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!DEMO_MODE || accounts.length === 0) return null;
  const current = findDemoAccount(role, selected) || accounts[0];
  const others = Object.keys(ROLE_LABEL).filter((r) => r !== role);

  return (
    <aside className="demo-panel" aria-label={tr('حسابات تجريبية', 'Demo accounts')}>
      <div className="demo-panel__head">
        <span className="demo-badge"><i aria-hidden="true" />{tr('تجريبي', 'Demo')}</span>
        <b>{tr('جرّب المنصة بحساب جاهز', 'Try the platform with a ready account')}</b>
        <button type="button" className="demo-link" onClick={() => setHelp(true)} aria-label={tr('ما الغرض من هذا؟', 'What is this for?')}>{tr('ما هذا؟', 'What\'s this?')}</button>
      </div>
      <button type="button" className="demo-btn is-block" onClick={() => fill(current.email)}>
        ⚡ {tr('تعبئة حساب تجريبي', 'Fill a demo account')} — {current.name[locale]}
      </button>
      {filled && <p className="demo-panel__ok" role="status">{tr('تمت التعبئة. اضغط «تسجيل الدخول» للمتابعة.', 'Filled. Press Sign in to continue.')}</p>}
      <button type="button" className="demo-link demo-panel__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? tr('إخفاء الحسابات', 'Hide accounts') : tr(`اختر حسابًا آخر (${accounts.length})`, `Choose another account (${accounts.length})`)}
      </button>
      {open && (
        <ul className="demo-panel__list">
          {accounts.map((a) => (
            <li key={a.email}>
              <button type="button" className={a.email === selected ? 'is-on' : ''} onClick={() => fill(a.email)}>
                <b>{a.name[locale]}</b><small>{a.role[locale]}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="demo-panel__switch">
        {tr('جرّب دورًا آخر:', 'Try another role:')}{' '}
        {others.map((r, i) => <React.Fragment key={r}>{i > 0 && ' · '}<Link to={ROLE_LOGIN_PATH[r]}>{tr(ROLE_LABEL[r][0], ROLE_LABEL[r][1])}</Link></React.Fragment>)}
      </p>
      <p className="demo-panel__note">{tr('للتجربة فقط — عند النشر يعمل كل مستخدم بحسابه وحسب دوره.', 'For testing only — at launch each person uses their own account and role.')}</p>
      <DemoWelcomeModal open={help} onClose={() => setHelp(false)} />
    </aside>
  );
}

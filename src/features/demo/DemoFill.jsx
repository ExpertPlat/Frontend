import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD, findDemoAccount } from './demoConfig';
import DemoIcon from './icons';
import DemoTour from './DemoTour';
import { RoleFlow } from './tourContent';
import './demo.css';

const ACCOUNTS_COPY = {
  user: {
    ar: 'يوجد حسابان لصاحب حالة. اسم الحساب المختار يظهر على الزر، ويمكنك تغييره من هذا السهم.',
    en: 'There are two client accounts. The selected one is shown on the button — change it from this arrow.',
  },
  expert: {
    ar: 'كل خبير يغطي تخصصاً ودولاً مختلفة. إذا دعوت خبيراً من حساب صاحب الحالة، اختر حسابه هنا لترى الطلب كما يصله.',
    en: 'Each expert covers a different specialty and countries. If you invited an expert as the client, pick them here to see the request as they receive it.',
  },
  admin: {
    ar: 'لكل حساب إداري صلاحيات مختلفة: المدير العام يرى كل شيء، والبقية مقيّدون بأدوارهم مثل التحقق والكتالوج والمالية.',
    en: 'Each admin account has different permissions: the super admin sees everything, the others are limited to their role (verification, catalog, finance…).',
  },
};

/**
 * Trial shortcut under the sign-in button: "Fill a demo account" + an account picker. No card around it, so the
 * login form keeps its design; what it is for is explained by the spotlight tour, not on the page.
 * Reads ?demo=<email> so hand-off links arrive pre-filled.
 */
export default function DemoFill({ role, onFill }) {
  const { tr, locale } = useLocale();
  const [params] = useSearchParams();
  const accounts = DEMO_ACCOUNTS[role] || [];
  const [selected, setSelected] = useState(accounts[0]?.email);
  const [open, setOpen] = useState(false);
  const [filled, setFilled] = useState(false);
  const wrap = useRef(null);
  const fillRef = useRef(onFill);
  fillRef.current = onFill;

  const fill = (email) => {
    setSelected(email);
    setFilled(true);
    setOpen(false);
    fillRef.current?.({ email, password: DEMO_PASSWORD });
  };

  useEffect(() => {
    if (!DEMO_MODE) return;
    const wanted = findDemoAccount(role, params.get('demo'));
    if (wanted) fill(wanted.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const steps = useMemo(() => [
    {
      target: '[data-tour="demo-fill"]',
      title: { ar: 'ادخل بحساب جاهز بنقرة واحدة', en: 'Sign in with a ready account in one click' },
      body: {
        ar: ['هذه نسخة تجريبية من المنصة، لذلك جهّزنا حسابات لكل دور بدل أن تنشئ حساباً جديداً.', 'اضغط هذا الزر لتعبئة البريد وكلمة المرور تلقائياً، ثم اضغط «تسجيل الدخول».'],
        en: ['This is a trial version of the platform, so every role has a ready-made account — no sign-up needed.', 'Press this button to fill the email and password, then press Sign in.'],
      },
    },
    {
      target: '[data-tour="demo-accounts"]',
      title: { ar: 'اختر الحساب الذي تريد تجربته', en: 'Choose the account to try' },
      body: ACCOUNTS_COPY[role],
    },
    {
      target: '[data-tour="demo-switch"]',
      title: { ar: 'وتنقّل بين الأدوار متى شئت', en: 'And move between roles any time' },
      body: {
        ar: 'الرحلة الكاملة تمر بثلاثة أطراف. في الواقع لكل شخص دور واحد، أما هنا فيمكنك أن تلعب الأدوار الثلاثة من زر «بدّل الحساب» الموجود في كل الصفحات.',
        en: 'The full journey involves three parties. In real life each person has one role; here you can play all three from the "Switch account" button on every page.',
      },
      extra: <RoleFlow />,
      finish: { ar: 'ابدأ التجربة', en: 'Start exploring' },
    },
  ], [role]);

  if (!DEMO_MODE || accounts.length === 0) return null;
  const current = findDemoAccount(role, selected) || accounts[0];

  return (
    <div className="demo-fill" ref={wrap}>
      <div className="demo-fill__or" aria-hidden="true"><span>{tr('أو', 'or')}</span></div>
      <div className={`demo-fill__group${filled ? ' is-filled' : ''}`}>
        <button type="button" className="demo-fill__main" data-tour="demo-fill" onClick={() => fill(current.email)}>
          <DemoIcon name={filled ? 'check' : 'key'} size={18} />
          <span className="demo-fill__label">{filled ? tr('تمت التعبئة', 'Filled') : tr('تعبئة حساب تجريبي', 'Fill a demo account')}</span>
          <span className="demo-fill__who">{current.name[locale]}</span>
        </button>
        <button
          type="button"
          className="demo-fill__more"
          data-tour="demo-accounts"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={tr('اختيار حساب آخر', 'Choose another account')}
          onClick={() => setOpen((v) => !v)}
        >
          <DemoIcon name="chevron" size={18} />
        </button>
        {open && (
          <ul className="demo-fill__menu" role="listbox" aria-label={tr('الحسابات المتاحة', 'Available accounts')}>
            {accounts.map((a) => (
              <li key={a.email} role="option" aria-selected={a.email === current.email}>
                <button type="button" onClick={() => fill(a.email)}>
                  <span><b>{a.name[locale]}</b><small>{a.role[locale]}</small></span>
                  {a.email === current.email && <DemoIcon name="check" size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <DemoTour id={`login-${role}`} steps={steps} priority={2} delay={700} />
    </div>
  );
}

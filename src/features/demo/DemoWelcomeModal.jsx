import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { DEMO_PASSWORD } from './demoConfig';
import './demo.css';

const SEEN_KEY = 'solveit-demo-welcome-v1';

export function demoWelcomeSeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}
function markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* storage can be blocked */ } }

/** Three short steps explaining what the trial shortcuts are for. Opens once automatically, or from the "?" link. */
export default function DemoWelcomeModal({ open, onClose }) {
  const { tr, dir } = useLocale();
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);
  if (!open) return null;
  const steps = [
    { icon: '🧪', title: tr('هذه نسخة تجريبية', 'This is a trial version'), body: tr('المنصة الآن في مرحلة التجربة وعدد الخبراء محدود. جهّزنا حسابات جاهزة لكل دور حتى تجرّب الرحلة كاملة بنفسك من دون تسجيل.', 'The platform is in its trial phase with a limited number of experts. We prepared ready-made accounts for every role so you can try the whole journey yourself without signing up.') },
    { icon: '⚡', title: tr('كيف أستخدمها؟', 'How do I use it?'), body: tr(`في كل صفحة تسجيل دخول ستجد زر «تعبئة حساب تجريبي». اضغطه فتُملأ الحقول (كلمة المرور ${DEMO_PASSWORD}) ثم اضغط «تسجيل الدخول». يمكنك اختيار حساب آخر من القائمة.`, `Every sign-in page has a "Fill a demo account" button. It fills the fields (password ${DEMO_PASSWORD}) — then press Sign in. You can pick another account from the list.`) },
    { icon: '🔁', title: tr('تنقّل بين الأدوار', 'Move between roles'), body: tr('بعد كل خطوة مهمة (إرسال حالة، عرض، حجز…) سنخبرك أين تذهب لاحقًا، مثل فتح لوحة الخبيرة سارة لرؤية العرض والتعامل معه. عند الإطلاق الفعلي سيعمل كل مستخدم ضمن دوره فقط.', 'After each key step (case sent, proposal, booking…) we tell you where to go next — e.g. open expert Sara\'s dashboard to see the request and act on it. At launch, each person will only work within their own role.') },
  ];
  const last = step === steps.length - 1;
  const close = () => { markSeen(); onClose?.(); };
  const s = steps[step];
  return (
    <div className="demo-modal-backdrop" role="presentation" dir={dir} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="demo-modal" role="dialog" aria-modal="true" aria-label={tr('شرح النسخة التجريبية', 'Trial walkthrough')}>
        <span className="demo-modal__tag">{tr('تجريبي · للتجربة فقط', 'Trial · for testing only')}</span>
        <div className="demo-modal__icon" aria-hidden="true">{s.icon}</div>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        <div className="demo-modal__dots" aria-hidden="true">{steps.map((_, i) => <i key={i} className={i === step ? 'is-on' : ''} />)}</div>
        <div className="demo-modal__foot">
          <button type="button" className="demo-btn is-ghost" onClick={close}>{tr('تخطّي', 'Skip')}</button>
          <span>
            {step > 0 && <button type="button" className="demo-btn is-ghost" onClick={() => setStep(step - 1)}>{tr('السابق', 'Back')}</button>}
            <button type="button" className="demo-btn" onClick={() => (last ? close() : setStep(step + 1))}>{last ? tr('فهمت، لنبدأ', 'Got it, let\'s go') : tr('التالي', 'Next')}</button>
          </span>
        </div>
      </div>
    </div>
  );
}

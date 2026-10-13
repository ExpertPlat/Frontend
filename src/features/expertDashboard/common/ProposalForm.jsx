import React, { useMemo, useState } from 'react';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { splitByShares, toMinor } from '../../../services/money';
import { useIdempotentAction } from '../../../services/hooks';
import { useUserI18n } from '../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Field, Select, TextArea, TextInput } from '../../userDashboard/components/ui';
import { useMoney } from '../../userDashboard/journey/parts';
import { contentFromForm, validateForm } from './proposalMapping';
import { fieldErrors } from './parts';

const MINUTES = [30, 45, 60, 90, 120];
const VALID_DAYS = [3, 7, 14, 30];
const REVIEW_HOURS = [24, 48, 72, 168];

/** Editable list of short texts (deliverables, exclusions). */
function ListInput({ items, onChange, placeholder, addLabel, max, min = 0, invalid }) {
  const { tr } = useUserI18n();
  const set = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)));
  return (
    <div className="ex-listinput">
      {items.map((item, index) => (
        <div key={index} className="ex-listinput__row">
          <TextInput value={item} onChange={(value) => set(index, value)} placeholder={placeholder} invalid={invalid && !item.trim()} maxLength={200} aria-label={`${placeholder} ${index + 1}`} />
          {items.length > min && <button type="button" className="ud-iconbtn ud-iconbtn--plain" aria-label={tr('حذف', 'Remove')} onClick={() => onChange(items.filter((_, i) => i !== index))}><UdIcon name="trash" size={17} /></button>}
        </div>
      ))}
      {items.length < max && <button type="button" className="ud-linkbtn" onClick={() => onChange([...items, ''])}><UdIcon name="plus" size={15} /> {addLabel}</button>}
    </div>
  );
}

/**
 * One form for a new proposal and for a revision. `onSubmit(content, { idempotencyKey })` receives the documented ProposalContent body.
 * The side summary shows what the client will pay, stage by stage, as the expert types.
 */
export default function ProposalForm({ initial, submitLabel, onSubmit, onCancel, intro }) {
  const { tr, tx } = useUserI18n();
  const money = useMoney();
  const { notify } = useBrandFeedback();
  const action = useIdempotentAction('proposal');
  const [form, setForm] = useState(() => ({
    ...initial,
    milestones: initial.milestones.map((m, i) => (m.title ? m : { ...m, title: i === 0 ? tr('الدفعة الأولى', 'First payment') : i === 1 ? tr('الدفعة الثانية', 'Second payment') : tr(`الدفعة ${i + 1}`, `Payment ${i + 1}`) })),
  }));
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const total = toMinor(form.price);
  const parts = useMemo(() => (total ? splitByShares(total, form.milestones.map((m) => Number(m.share) || 0)) : []), [total, form.milestones]);
  const shareSum = form.milestones.reduce((sum, m) => sum + (Number(m.share) || 0), 0);

  const setMilestone = (index, patch) => set({ milestones: form.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)) });
  const addMilestone = () => {
    if (form.milestones.length >= 4) return;
    const next = [...form.milestones, { title: '', share: 0 }];
    set({ milestones: next });
  };
  const removeMilestone = (index) => {
    if (form.milestones.length <= 1) return;
    const rest = form.milestones.filter((_, i) => i !== index);
    const missing = 100 - rest.reduce((sum, m) => sum + (Number(m.share) || 0), 0);
    rest[rest.length - 1] = { ...rest[rest.length - 1], share: (Number(rest[rest.length - 1].share) || 0) + missing };
    set({ milestones: rest });
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateForm(form, tr);
    setErrors(found); setServerErrors({});
    if (Object.keys(found).length) { notify({ message: tr('راجع الحقول المظللة.', 'Please review the highlighted fields.'), tone: 'warning' }); return; }
    const result = await action.run(({ idempotencyKey }) => onSubmit(contentFromForm(form), { idempotencyKey }));
    if (!result.ok) {
      setServerErrors(fieldErrors(result.error));
      notify({ message: result.message, tone: 'error' });
    }
  };
  const err = (key) => errors[key] || serverErrors[key];
  const serverList = Object.entries(serverErrors).filter(([key]) => !['scopeSummary', 'currency'].includes(key) && !errors[key]);

  return (
    <form className="ex-proposal" onSubmit={submit} noValidate>
      {intro}
      <Card className="jr-card jr-block">
        <CardHeader icon="fileCheck" title={tr('ماذا ستقدّم؟', 'What will you deliver?')} />
        <Field label={tr('وصف العمل', 'Scope of work')} required htmlFor="ex-scope" error={err('scopeSummary')} hint={tr('اشرح بجملتين ما الذي سيحصل عليه العميل.', 'In a couple of sentences, say what the client gets.')}>
          <TextArea id="ex-scope" rows={4} value={form.scopeSummary} onChange={(value) => set({ scopeSummary: value })} maxLength={4000} invalid={!!err('scopeSummary')} />
        </Field>
        <Field label={tr('المخرجات', 'Deliverables')} required error={err('deliverables')} hint={tr('مثال: تقرير مكتوب، جلسة فيديو.', 'For example: a written report, a video session.')}>
          <ListInput items={form.deliverables} onChange={(deliverables) => set({ deliverables })} placeholder={tr('مخرج', 'Deliverable')} addLabel={tr('إضافة مخرج', 'Add a deliverable')} max={10} min={1} invalid={!!err('deliverables')} />
        </Field>
        <Field label={tr('غير مشمول', 'Not included')} optional error={err('exclusions')}>
          <ListInput items={form.exclusions} onChange={(exclusions) => set({ exclusions })} placeholder={tr('بند غير مشمول', 'Excluded item')} addLabel={tr('إضافة بند', 'Add an item')} max={15} />
        </Field>
        <Field label={tr('ما تحتاجه من العميل', 'What you need from the client')} optional htmlFor="ex-needs">
          <TextArea id="ex-needs" rows={2} value={form.inputsRequired} onChange={(value) => set({ inputsRequired: value })} maxLength={2000} />
        </Field>
      </Card>

      <Card className="jr-card jr-block">
        <CardHeader icon="card" title={tr('السعر والمراحل', 'Price and stages')} />
        <div className="jr-basics">
          <Field label={tr(`السعر الإجمالي (${form.currency})`, `Total price (${form.currency})`)} required htmlFor="ex-price" error={err('price')}>
            <TextInput id="ex-price" inputMode="decimal" dir="ltr" value={form.price} onChange={(value) => set({ price: value.replace(/[^\d.]/g, '') })} invalid={!!err('price')} placeholder="4500" />
          </Field>
          <Field label={tr('مدة الجلسة', 'Session length')} htmlFor="ex-minutes">
            <Select id="ex-minutes" value={String(form.consultationMinutes)} onChange={(value) => set({ consultationMinutes: Number(value) })} options={MINUTES.map((m) => ({ value: String(m), label: tr(`${m} دقيقة`, `${m} minutes`) }))} />
          </Field>
          <Field label={tr('صلاحية العرض', 'Proposal valid for')} htmlFor="ex-valid">
            <Select id="ex-valid" value={String(form.validityDays)} onChange={(value) => set({ validityDays: Number(value) })} options={VALID_DAYS.map((d) => ({ value: String(d), label: tr(`${d} أيام`, `${d} days`) }))} />
          </Field>
        </div>
        <Field label={tr('مراحل الدفع', 'Payment stages')} required error={err('milestones')} hint={tr('تُحرَّر كل دفعة عند إنجاز مرحلتها. النسب تجمع 100%.', 'Each part is released when its stage is done. Percentages add up to 100%.')}>
          <div className="ex-miles">
            {form.milestones.map((m, index) => (
              <div key={index} className="ex-miles__row">
                <TextInput value={m.title} onChange={(value) => setMilestone(index, { title: value })} placeholder={tr('اسم المرحلة', 'Stage name')} invalid={!!errors.milestones && String(m.title).trim().length < 3} maxLength={200} aria-label={`${tr('اسم المرحلة', 'Stage name')} ${index + 1}`} />
                <div className="ex-miles__share"><TextInput inputMode="numeric" dir="ltr" value={String(m.share)} onChange={(value) => setMilestone(index, { share: Number(value.replace(/\D/g, '')) || 0 })} aria-label={`${tr('النسبة', 'Percent')} ${index + 1}`} /><span>%</span></div>
                <b className="ex-miles__amount" dir="ltr">{total ? money({ amountMinor: parts[index], currency: form.currency }) : '—'}</b>
                {form.milestones.length > 1 && <button type="button" className="ud-iconbtn ud-iconbtn--plain" aria-label={tr('حذف المرحلة', 'Remove stage')} onClick={() => removeMilestone(index)}><UdIcon name="trash" size={17} /></button>}
              </div>
            ))}
            <div className="ex-miles__foot">
              {form.milestones.length < 4 && <button type="button" className="ud-linkbtn" onClick={addMilestone}><UdIcon name="plus" size={15} /> {tr('إضافة مرحلة', 'Add a stage')}</button>}
              <span className={shareSum === 100 ? 'is-ok' : 'is-bad'} dir="ltr">{shareSum}%</span>
            </div>
          </div>
        </Field>
        <details className="ex-more">
          <summary>{tr('إعدادات إضافية', 'More settings')}</summary>
          <div className="jr-basics">
            <Field label={tr('أسئلة المتابعة بعد الجلسة', 'Follow-up questions after the session')} htmlFor="ex-clar">
              <Select id="ex-clar" value={String(form.clarificationAllowance)} onChange={(value) => set({ clarificationAllowance: Number(value) })} options={[0, 1, 2, 3, 5].map((n) => ({ value: String(n), label: String(n) }))} />
            </Field>
            <Field label={tr('مدة مراجعة العميل للتسليم', 'Client review period')} htmlFor="ex-review">
              <Select id="ex-review" value={String(form.reviewPeriodHours)} onChange={(value) => set({ reviewPeriodHours: Number(value) })} options={REVIEW_HOURS.map((h) => ({ value: String(h), label: h < 48 ? tr(`${h} ساعة`, `${h} hours`) : tr(`${h / 24} أيام`, `${h / 24} days`) }))} />
            </Field>
          </div>
        </details>
      </Card>

      {serverList.length > 0 && <div className="jr-banner is-danger" role="alert"><UdIcon name="alert" size={20} /><span>{serverList.map(([, message]) => message).join(' ')}</span></div>}
      <div className="jr-confirmbar ex-proposal__bar">
        <div><small>{tr('إجمالي العرض', 'Proposal total')}</small><b dir="ltr">{total ? money({ amountMinor: total, currency: form.currency }) : '—'}</b></div>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={action.busy}>{tr('إلغاء', 'Cancel')}</Button>}
        <Button type="submit" icon="send" loading={action.busy}>{submitLabel}</Button>
      </div>
    </form>
  );
}

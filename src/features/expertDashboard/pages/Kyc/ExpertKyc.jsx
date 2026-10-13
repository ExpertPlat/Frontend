import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { kycService } from '../../../../services/kyc/kycService';
import { catalogService } from '../../../../services/user/accountService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Field, IconTile, PageHeader, Select, SkeletonRows, StatusPill, Stepper, TextArea, TextInput } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { expertKycDraftPayload, expertKycToForm, fileName, findPersistedKycChild, getExpertKycStatus, getKycReviewFeedback, getStatusMeta, unwrapKycPayload } from '../../../kyc/data/kycStore';
import { ResourceError, fieldErrors } from '../../common/parts';
import { useExpertSession } from '../../session/ExpertSessionContext';
import { DOMAIN_LABEL, LANGUAGE_LABEL, kycPill } from '../../utils/expertStatuses';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'application/pdf,image/png,image/jpeg';
const CREDENTIAL_TYPES = { certificate: ['شهادة', 'Certificate'], license: ['رخصة مزاولة', 'Practice licence'], membership: ['عضوية نقابة', 'Association membership'] };
const BANNER = {
  not_submitted: ['edit', ['وثّق حسابك', 'Verify your account'], ['أكمل ثلاث خطوات قصيرة ونراجع طلبك. لن تظهر للعملاء قبل الاعتماد.', 'Three short steps and we review your request. Clients cannot see you before approval.']],
  draft: ['edit', ['أكمل طلب التوثيق', 'Finish your verification'], ['بياناتك محفوظة كمسودة. أكملها ثم أرسلها للمراجعة.', 'Your details are saved as a draft. Finish them and submit.']],
  submitted: ['send', ['أُرسل طلبك', 'Request submitted'], ['استلمنا طلبك وسيبدأ فريق المراجعة بدراسته قريبًا.', 'We received your request and the review team will start soon.']],
  under_review: ['clock', ['طلبك قيد المراجعة', 'Your request is under review'], ['سنُعلمك بالنتيجة في الإشعارات، وقد نطلب منك معلومات إضافية.', 'You will be notified of the outcome; we may ask for more information.']],
  needs_information: ['alert', ['مطلوب استكمال معلومات', 'More information needed'], ['عدّل ما طلبه المراجع ثم أعد الإرسال.', 'Update what the reviewer asked for, then resubmit.']],
  verified: ['badgeCheck', ['تم توثيق حسابك', 'You are verified'], ['اعتُمدت هويتك ومؤهلاتك. أكمل ملفك المهني وانشره لتستقبل الطلبات.', 'Your identity and credentials were approved. Complete and publish your profile to get requests.']],
  rejected: ['xCircle', ['لم يُعتمد الطلب', 'Request not approved'], ['راجع السبب ثم صحّح بياناتك وأرسل طلبًا جديدًا.', 'Read the reason, correct your details and submit again.']],
};

function DocPick({ id, doc, busy, disabled, onPick, onRemove, label }) {
  const { tr } = useUserI18n();
  const ref = useRef(null);
  return (
    <div className="ex-doc">
      <input ref={ref} id={id} type="file" accept={ACCEPT} hidden onChange={(event) => { const f = event.target.files?.[0]; event.target.value = ''; if (f) onPick(f); }} />
      {doc
        ? <><UdIcon name="file" size={18} /><span className="ex-doc__name">{fileName(doc)}</span>{!disabled && <><Button type="button" size="sm" variant="ghost" loading={busy} onClick={() => ref.current?.click()}>{tr('استبدال', 'Replace')}</Button><button type="button" className="ex-icon" aria-label={tr('حذف', 'Remove')} onClick={onRemove}><UdIcon name="trash" size={15} /></button></>}</>
        : <Button type="button" size="sm" variant="secondary" icon="upload" loading={busy} disabled={disabled} onClick={() => ref.current?.click()}>{label || tr('أرفق ملفًا', 'Attach a file')}</Button>}
    </div>
  );
}

const blank = {
  experience: () => ({ id: `experience-local-${Date.now()}`, jobTitle: '', organization: '', from: '', to: '', current: false, description: '' }),
  qualification: () => ({ id: `qualification-local-${Date.now()}`, degree: '', field: '', institution: '', graduationYear: '', document: null }),
  credential: () => ({ id: `credential-local-${Date.now()}`, type: 'certificate', name: '', issuer: '', issueDate: '', expiryDate: '', document: null }),
};

/** Verification wizard: identity & scope, background, review & submit. Each "continue" saves the draft. */
export default function ExpertKyc() {
  const { tr, tx, language, fmtDate } = useUserI18n();
  const { notify, confirm } = useBrandFeedback();
  const session = useExpertSession();
  const countries = useResource(() => catalogService.countries(), []);
  const remote = useResource(() => kycService.getExpertKyc(), []);
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);

  const apply = useCallback((next) => { setPayload(next); setForm(expertKycToForm(next)); session.reloadMe(); }, [session]);
  useEffect(() => { if (remote.data) { setPayload(remote.data); setForm(expertKycToForm(remote.data)); } }, [remote.data]);

  const status = payload ? getExpertKycStatus(payload) : 'not_submitted';
  const meta = getStatusMeta(status);
  const editable = meta.editable;
  const application = unwrapKycPayload(payload || {}).application || {};
  const feedback = payload ? getKycReviewFeedback(payload) : null;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setList = (key, index, patch) => setForm((f) => ({ ...f, [key]: f[key].map((x, i) => (i === index ? { ...x, ...patch } : x)) }));
  const addTo = (key, make) => setForm((f) => ({ ...f, [key]: [...f[key], make()] }));
  const removeFrom = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));

  const run = async (name, work, success) => {
    setBusy(name); setErrors({});
    try { const out = await work(); if (success) notify({ message: success, tone: 'success' }); return out; } catch (error) {
      setErrors(fieldErrors(error)); notify({ message: getErrorMessage(error), tone: 'error' }); return null;
    } finally { setBusy(''); }
  };
  const persist = async (current = form) => { const res = await kycService.saveExpertKycDraft(expertKycDraftPayload(current)); return { res, saved: expertKycToForm(res) }; };
  const refresh = async () => apply(await kycService.getExpertKyc());

  const saveAndGo = (to) => run('save', async () => { const { res } = await persist(); apply(res); setStep(to); window.scrollTo?.({ top: 0 }); });
  const upload = (name, documentType, file, relation = {}) => {
    if (file.size > MAX_BYTES) { notify({ message: tr('الملف أكبر من 10 ميغابايت.', 'The file is larger than 10 MB.'), tone: 'error' }); return null; }
    return run(name, async () => {
      const { saved } = await persist();
      const ids = {};
      if (relation.collection) { const child = findPersistedKycChild(form, saved, relation.collection, relation.id); if (!child) throw new Error('missing'); ids[relation.key] = child.id; }
      await kycService.uploadExpertKycDocument({ documentType, file, ...ids });
      await refresh();
    });
  };
  const removeDoc = (name, doc) => run(name, async () => { await kycService.deleteExpertKycDocument(doc.id); await refresh(); });

  const issues = [];
  if (form) {
    if (form.fullName.trim().length < 3) issues.push([0, tr('اكتب اسمك الكامل.', 'Enter your full name.')]);
    if (!form.country || !form.language || !form.domain || !form.jurisdiction.trim()) issues.push([0, tr('أكمل الدولة واللغة والمجال ونطاق الممارسة.', 'Complete country, language, field and jurisdiction.')]);
    if (!form.identityEvidence) issues.push([0, tr('أرفق وثيقة الهوية.', 'Attach your ID document.')]);
    if (!form.cv) issues.push([0, tr('أرفق سيرتك الذاتية.', 'Attach your CV.')]);
    if (!form.experiences.some((x) => x.jobTitle.trim() && x.organization.trim())) issues.push([1, tr('أضف خبرة عملية واحدة على الأقل.', 'Add at least one work experience.')]);
    if (!form.qualifications.some((q) => q.degree.trim() && q.institution.trim())) issues.push([1, tr('أضف مؤهلًا علميًا واحدًا على الأقل.', 'Add at least one qualification.')]);
    if (form.qualifications.some((q) => !q.document)) issues.push([1, tr('أرفق وثيقة لكل مؤهل.', 'Attach a document to every qualification.')]);
    if (form.credentials.some((c) => !c.document)) issues.push([1, tr('أرفق وثيقة لكل شهادة أو رخصة.', 'Attach a document to every licence or certificate.')]);
  }
  const submit = async () => {
    setTried(true); if (issues.length) return;
    const ok = await confirm({ title: tr('إرسال الطلب للمراجعة؟', 'Submit for review?'), message: tr('يُقفل الطلب للتعديل أثناء المراجعة وتصلك النتيجة في الإشعارات.', 'The request is locked while under review and you are notified of the outcome.'), confirmLabel: tr('إرسال', 'Submit'), cancelLabel: tr('مراجعة أخيرة', 'Review again') });
    if (!ok) return;
    await run('submit', async () => { const { res } = await persist(); apply(res); apply(await kycService.submitExpertKyc()); setStep(0); }, tr('أُرسل طلب التوثيق.', 'Verification request sent.'));
  };

  const [icon, title, text] = BANNER[status] || BANNER.draft;
  const pill = kycPill(status);
  const disabled = !editable;
  const err = (key) => { const v = errors[key]; return Array.isArray(v) ? v[0] : v; };
  const needsFor = (n) => tried && issues.filter(([s]) => s === n).map(([, m]) => m);

  return (
    <div className="jr-page jr-page--narrow">
      <PageHeader icon="shieldCheck" title={tr('توثيق حسابك', 'Verify your account')} subtitle={tr('نتحقق من هويتك ومؤهلاتك مرة واحدة فقط.', 'We check your identity and credentials just once.')} />
      <ResourceError resource={remote} />
      {remote.loading && !form && <Card className="jr-card"><SkeletonRows rows={4} /></Card>}

      {form && (
        <>
          <Card className={`jr-card ex-kycbanner is-${meta.tone}`}>
            <IconTile icon={icon} tone={meta.tone === 'success' ? 'olive' : 'peach'} size={52} iconSize={24} />
            <div><div className="ex-kycbanner__top"><h2>{tx(title)}</h2>{status !== 'not_submitted' && <StatusPill tone={pill.tone}>{tx(pill.label)}</StatusPill>}</div><p>{tx(text)}</p>
              {application.reference && <small dir="ltr">{application.reference} · #{application.attemptNumber}</small>}</div>
            {status === 'verified' && <Button icon="user" to={PATHS.EXPERT_PROFILE}>{tr('أكمل ملفي المهني', 'Complete my profile')}</Button>}
          </Card>

          {feedback && ['needs_information', 'rejected', 'draft'].includes(status) && (
            <Card className="jr-card jr-block ex-feedback">
              <CardHeader icon="message" title={tr('ملاحظات المراجع', 'Reviewer notes')} />
              {feedback.reason && <p className="jr-lead">{feedback.reason}</p>}
              {feedback.requestedChanges.length > 0 && <ul className="ex-todo">{feedback.requestedChanges.map((c) => <li key={c.id}><UdIcon name="arrowRight" size={15} /><span>{c.message}</span></li>)}</ul>}
            </Card>
          )}

          {editable ? (
            <>
              <Stepper label={tr('خطوات التوثيق', 'Verification steps')} current={step} steps={[{ label: tr('بياناتك', 'About you') }, { label: tr('خبراتك ومؤهلاتك', 'Background') }, { label: tr('مراجعة وإرسال', 'Review & send') }]} />

              {step === 0 && (
                <Card className="jr-card jr-block">
                  <CardHeader icon="user" title={tr('بياناتك ونطاق ممارستك', 'About you and your practice')} />
                  <div className="jr-basics">
                    <Field label={tr('الاسم الكامل', 'Full name')} required htmlFor="kyc-name" error={err('fullName')}><TextInput id="kyc-name" value={form.fullName} onChange={(v) => set({ fullName: v })} /></Field>
                    <Field label={tr('البريد الإلكتروني', 'Email')} htmlFor="kyc-mail"><TextInput id="kyc-mail" dir="ltr" readOnly value={form.email} onChange={() => {}} /></Field>
                    <Field label={tr('بلد الإقامة', 'Country of residence')} required htmlFor="kyc-country" error={err('country')}><Select id="kyc-country" value={form.country} placeholder={tr('اختر', 'Choose')} onChange={(v) => set({ country: v })} options={(countries.data || []).map((c) => ({ value: c.code, label: c.name }))} /></Field>
                    <Field label={tr('لغة التواصل', 'Working language')} required htmlFor="kyc-lang" error={err('language')}><Select id="kyc-lang" value={form.language} placeholder={tr('اختر', 'Choose')} onChange={(v) => set({ language: v })} options={Object.entries(LANGUAGE_LABEL).map(([value, label]) => ({ value, label: tx(label) }))} /></Field>
                    <Field label={tr('مجال الخبرة', 'Field')} required htmlFor="kyc-domain" error={err('domain')}><Select id="kyc-domain" value={form.domain} placeholder={tr('اختر', 'Choose')} onChange={(v) => set({ domain: v })} options={Object.entries(DOMAIN_LABEL).map(([value, label]) => ({ value, label: tx(label) }))} /></Field>
                    <Field label={tr('نطاق الممارسة (الدولة أو الولاية)', 'Jurisdiction you practise in')} required htmlFor="kyc-jur" error={err('jurisdiction')}><TextInput id="kyc-jur" value={form.jurisdiction} onChange={(v) => set({ jurisdiction: v })} /></Field>
                  </div>
                  <Field label={tr('وثيقة الهوية', 'ID document')} required error={err('identityEvidence')} hint={tr('جواز سفر أو هوية (PDF أو صورة، حتى 10 ميغابايت).', 'Passport or national ID (PDF or image, up to 10 MB).')}>
                    <DocPick id="kyc-id" doc={form.identityEvidence} busy={busy === 'id'} onPick={(f) => upload('id', 'identity', f)} onRemove={() => removeDoc('id', form.identityEvidence)} />
                  </Field>
                  <Field label={tr('السيرة الذاتية', 'CV')} required error={err('cv')}>
                    <DocPick id="kyc-cv" doc={form.cv} busy={busy === 'cv'} onPick={(f) => upload('cv', 'cv', f)} onRemove={() => removeDoc('cv', form.cv)} />
                  </Field>
                  {needsFor(0).map((m) => <small key={m} className="ex-err">{m}</small>)}
                </Card>
              )}

              {step === 1 && (
                <>
                  <Card className="jr-card jr-block">
                    <CardHeader icon="briefcase" title={tr('خبراتك العملية', 'Work experience')} aside={<Button type="button" size="sm" variant="secondary" icon="plus" onClick={() => addTo('experiences', blank.experience)}>{tr('إضافة', 'Add')}</Button>} />
                    {form.experiences.map((x, i) => (
                      <fieldset key={x.id} className="ex-entry">
                        <div className="jr-basics">
                          <Field label={tr('المسمى', 'Job title')} htmlFor={`xp-t-${i}`}><TextInput id={`xp-t-${i}`} value={x.jobTitle} onChange={(v) => setList('experiences', i, { jobTitle: v })} /></Field>
                          <Field label={tr('الجهة', 'Organisation')} htmlFor={`xp-o-${i}`}><TextInput id={`xp-o-${i}`} value={x.organization} onChange={(v) => setList('experiences', i, { organization: v })} /></Field>
                          <Field label={tr('من', 'From')} htmlFor={`xp-f-${i}`}><div className="ud-input"><input id={`xp-f-${i}`} type="date" dir="ltr" value={x.from || ''} onChange={(e) => setList('experiences', i, { from: e.target.value })} /></div></Field>
                          <Field label={tr('إلى', 'To')} htmlFor={`xp-e-${i}`}><div className="ud-input"><input id={`xp-e-${i}`} type="date" dir="ltr" disabled={x.current} value={x.to || ''} onChange={(e) => setList('experiences', i, { to: e.target.value })} /></div></Field>
                        </div>
                        <label className="ex-check"><input type="checkbox" checked={x.current} onChange={(e) => setList('experiences', i, { current: e.target.checked })} />{tr('أعمل هنا حاليًا', 'I work here now')}</label>
                        <Field label={tr('وصف مختصر', 'Short description')} optional htmlFor={`xp-d-${i}`}><TextArea id={`xp-d-${i}`} rows={2} value={x.description} onChange={(v) => setList('experiences', i, { description: v })} maxLength={500} /></Field>
                        <Button type="button" size="sm" variant="ghost" icon="trash" onClick={() => removeFrom('experiences', i)}>{tr('حذف', 'Remove')}</Button>
                      </fieldset>
                    ))}
                    {form.experiences.length === 0 && <p className="jr-lead">{tr('أضف آخر جهة عملت بها على الأقل.', 'Add at least your latest workplace.')}</p>}
                    {err('experiences') && <small className="ex-err">{err('experiences')}</small>}
                  </Card>

                  <Card className="jr-card jr-block">
                    <CardHeader icon="fileCheck" title={tr('مؤهلاتك العلمية', 'Qualifications')} aside={<Button type="button" size="sm" variant="secondary" icon="plus" onClick={() => addTo('qualifications', blank.qualification)}>{tr('إضافة', 'Add')}</Button>} />
                    {form.qualifications.map((q, i) => (
                      <fieldset key={q.id} className="ex-entry">
                        <div className="jr-basics">
                          <Field label={tr('الدرجة', 'Degree')} htmlFor={`q-d-${i}`}><TextInput id={`q-d-${i}`} value={q.degree} onChange={(v) => setList('qualifications', i, { degree: v })} /></Field>
                          <Field label={tr('التخصص', 'Field of study')} htmlFor={`q-f-${i}`}><TextInput id={`q-f-${i}`} value={q.field} onChange={(v) => setList('qualifications', i, { field: v })} /></Field>
                          <Field label={tr('الجامعة', 'Institution')} htmlFor={`q-i-${i}`}><TextInput id={`q-i-${i}`} value={q.institution} onChange={(v) => setList('qualifications', i, { institution: v })} /></Field>
                          <Field label={tr('سنة التخرج', 'Graduation year')} htmlFor={`q-y-${i}`}><TextInput id={`q-y-${i}`} dir="ltr" inputMode="numeric" maxLength={4} value={q.graduationYear} onChange={(v) => setList('qualifications', i, { graduationYear: v.replace(/\D/g, '') })} /></Field>
                        </div>
                        <Field label={tr('وثيقة المؤهل', 'Qualification document')} required>
                          <DocPick id={`q-doc-${i}`} doc={q.document} busy={busy === `q${i}`} onPick={(f) => upload(`q${i}`, 'qualification', f, { collection: 'qualifications', key: 'qualificationId', id: q.id })} onRemove={() => q.document && removeDoc(`q${i}`, q.document)} />
                        </Field>
                        <Button type="button" size="sm" variant="ghost" icon="trash" onClick={() => removeFrom('qualifications', i)}>{tr('حذف', 'Remove')}</Button>
                      </fieldset>
                    ))}
                    {form.qualifications.length === 0 && <p className="jr-lead">{tr('أضف مؤهلك الأعلى على الأقل.', 'Add at least your highest qualification.')}</p>}
                    {err('qualifications') && <small className="ex-err">{err('qualifications')}</small>}
                  </Card>

                  <Card className="jr-card jr-block">
                    <CardHeader icon="badgeCheck" title={tr('الرخص والشهادات', 'Licences and certificates')} aside={<Button type="button" size="sm" variant="secondary" icon="plus" onClick={() => addTo('credentials', blank.credential)}>{tr('إضافة', 'Add')}</Button>} />
                    {form.credentials.map((c, i) => (
                      <fieldset key={c.id} className="ex-entry">
                        <div className="jr-basics">
                          <Field label={tr('النوع', 'Type')} htmlFor={`c-t-${i}`}><Select id={`c-t-${i}`} value={c.type} onChange={(v) => setList('credentials', i, { type: v })} options={Object.entries(CREDENTIAL_TYPES).map(([value, label]) => ({ value, label: tx(label) }))} /></Field>
                          <Field label={tr('الاسم', 'Name')} htmlFor={`c-n-${i}`}><TextInput id={`c-n-${i}`} value={c.name} onChange={(v) => setList('credentials', i, { name: v })} /></Field>
                          <Field label={tr('الجهة المانحة', 'Issuer')} htmlFor={`c-i-${i}`}><TextInput id={`c-i-${i}`} value={c.issuer} onChange={(v) => setList('credentials', i, { issuer: v })} /></Field>
                          <Field label={tr('تاريخ الانتهاء', 'Expiry date')} optional htmlFor={`c-e-${i}`}><div className="ud-input"><input id={`c-e-${i}`} type="date" dir="ltr" value={c.expiryDate || ''} onChange={(e) => setList('credentials', i, { expiryDate: e.target.value })} /></div></Field>
                        </div>
                        <Field label={tr('الوثيقة', 'Document')} required>
                          <DocPick id={`c-doc-${i}`} doc={c.document} busy={busy === `c${i}`} onPick={(f) => upload(`c${i}`, 'credential', f, { collection: 'credentials', key: 'credentialId', id: c.id })} onRemove={() => c.document && removeDoc(`c${i}`, c.document)} />
                        </Field>
                        <Button type="button" size="sm" variant="ghost" icon="trash" onClick={() => removeFrom('credentials', i)}>{tr('حذف', 'Remove')}</Button>
                      </fieldset>
                    ))}
                    {form.credentials.length === 0 && <p className="jr-lead">{tr('اختياري: أضف رخصة المزاولة إن وُجدت.', 'Optional: add your practice licence if you have one.')}</p>}
                    {err('credentials') && <small className="ex-err">{err('credentials')}</small>}
                  </Card>
                  {needsFor(1).map((m) => <small key={m} className="ex-err">{m}</small>)}
                </>
              )}

              {step === 2 && (
                <Card className="jr-card jr-block">
                  <CardHeader icon="send" title={tr('راجع وأرسل', 'Review and send')} />
                  {issues.length === 0
                    ? <div className="jr-banner is-success"><UdIcon name="checkCircle" size={20} /><span>{tr('كل شيء جاهز للإرسال.', 'Everything is ready to send.')}</span></div>
                    : <ul className="ex-todo">{issues.map(([s, m]) => <li key={m}><UdIcon name="alert" size={16} /><span>{m}</span><button type="button" className="ud-linkbtn" onClick={() => setStep(s)}>{tr('اذهب', 'Go')}</button></li>)}</ul>}
                  {err('identityEvidence') && <small className="ex-err">{err('identityEvidence')}</small>}
                  <dl className="ex-summary">
                    <div><dt>{tr('الاسم', 'Name')}</dt><dd>{form.fullName || '—'}</dd></div>
                    <div><dt>{tr('المجال', 'Field')}</dt><dd>{DOMAIN_LABEL[form.domain] ? tx(DOMAIN_LABEL[form.domain]) : '—'} · {form.jurisdiction || '—'}</dd></div>
                    <div><dt>{tr('الخبرات', 'Experience')}</dt><dd>{form.experiences.length}</dd></div>
                    <div><dt>{tr('المؤهلات', 'Qualifications')}</dt><dd>{form.qualifications.length}</dd></div>
                    <div><dt>{tr('الشهادات والرخص', 'Licences')}</dt><dd>{form.credentials.length}</dd></div>
                  </dl>
                </Card>
              )}

              <div className="jr-confirmbar">
                {step > 0 ? <Button type="button" variant="ghost" icon="arrowRight" iconDir onClick={() => setStep(step - 1)}>{tr('السابق', 'Back')}</Button> : <span />}
                {step < 2
                  ? <Button type="button" iconEnd="arrowRight" iconDir loading={busy === 'save'} onClick={() => saveAndGo(step + 1)}>{tr('حفظ ومتابعة', 'Save and continue')}</Button>
                  : <Button type="button" icon="send" loading={busy === 'submit'} onClick={submit}>{status === 'needs_information' ? tr('أعد الإرسال', 'Resubmit') : tr('أرسل للمراجعة', 'Submit for review')}</Button>}
              </div>
            </>
          ) : (
            <Card className="jr-card jr-block">
              <CardHeader icon="file" title={tr('ملخص طلبك', 'Your request')} />
              <dl className="ex-summary">
                <div><dt>{tr('الاسم', 'Name')}</dt><dd>{form.fullName}</dd></div>
                <div><dt>{tr('المجال', 'Field')}</dt><dd>{DOMAIN_LABEL[form.domain] ? tx(DOMAIN_LABEL[form.domain]) : form.domain} · {form.jurisdiction}</dd></div>
                <div><dt>{tr('الخبرات / المؤهلات / الرخص', 'Experience / Qualifications / Licences')}</dt><dd>{form.experiences.length} / {form.qualifications.length} / {form.credentials.length}</dd></div>
                {application.submittedAt && <div><dt>{tr('تاريخ الإرسال', 'Submitted')}</dt><dd>{fmtDate(application.submittedAt)}</dd></div>}
              </dl>
            </Card>
          )}

        </>
      )}
    </div>
  );
}

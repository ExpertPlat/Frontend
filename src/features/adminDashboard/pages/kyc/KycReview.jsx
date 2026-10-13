import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { kycService } from '../../../../services/kyc/kycService';
import { saveBlobDownload } from '../../../../utils/downloadBlob';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { KYC_REVIEW_SECTIONS } from '../../../kyc/data/kycStore';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Breadcrumbs, Button, Field, Select, TextArea, TextInput } from '../../../userDashboard/components/ui';
import { normalizeAdminKycApplication } from '../../data/adminKycData';
import { buildKycApprovalScope, buildKycEvidenceCandidates, getKycVerificationPolicy, isHttpsUrl } from '../../data/adminKycVerification';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, KV, LoadFailed, Notice, Section, Status, Timeline, When, useAdminAction, useLabel } from '../../ui/kit';
import { COUNTRIES, DOMAINS, LANGUAGES, SERVICE_TYPES, kycStatus } from '../../ui/statuses';

const emptyChange = () => ({ key: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, section: 'identity_scope', documentId: '', message: '' });
const sizeOf = (bytes) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);

function DocumentRow({ doc, canReview, busy, onToggle, onDownload }) {
  const { tr } = useUserI18n();
  return (
    <div className={`ad-doc${doc.reviewed ? ' is-checked' : ''}`}>
      <span className="ad-doc__icon"><UdIcon name="file" size={19} /></span>
      <span className="ad-doc__copy"><b dir="auto">{doc.originalName || doc.name || `#${doc.id}`}</b><small><span className="ad-size">{sizeOf(doc.size)}</span>{doc.reviewedAt ? <> · {tr('روجع', 'Checked')} <When value={doc.reviewedAt} /></> : null}</small></span>
      <Button variant="ghost" size="sm" icon="download" onClick={() => onDownload(doc)}>{tr('تنزيل', 'Download')}</Button>
      {canReview
        ? <Button variant={doc.reviewed ? 'soft' : 'secondary'} size="sm" icon={doc.reviewed ? 'checkCircle' : 'eye'} loading={busy === doc.id} onClick={() => onToggle(doc)}>{doc.reviewed ? tr('تمت المراجعة', 'Checked') : tr('تأشير كمُراجَع', 'Mark as checked')}</Button>
        : <Status meta={{ tone: doc.reviewed ? 'success' : 'neutral', label: doc.reviewed ? ['تمت المراجعة', 'Checked'] : ['لم تُراجع', 'Not checked'] }} />}
    </div>
  );
}

/** One KYC application — start review, check each document, then approve (with verified scopes), request information or reject. */
export default function KycReview() {
  const { kycId } = useParams();
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { can, refreshQueues } = useAdminSession();
  const detail = useResource(async () => normalizeAdminKycApplication(await kycService.getAdminKycApplication(kycId)), [kycId]);
  const reloadAll = async (options) => { await detail.reload(options); refreshQueues(); };
  const action = useAdminAction(reloadAll);
  const [docBusy, setDocBusy] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState('');
  const [changes, setChanges] = useState([emptyChange()]);
  const [scope, setScope] = useState(null);
  const [errors, setErrors] = useState({});

  const request = detail.data;
  const application = request?.application || {};
  const documents = request?.documents || [];
  const policy = getKycVerificationPolicy(application.domain);
  const regulated = policy === 'regulated';
  const checked = documents.filter((d) => d.reviewed).length;
  const allChecked = documents.length > 0 && checked === documents.length;
  const canReview = can(P.EXPERTS_REVIEW_KYC) && request?.statusCode === 'under_review';
  const candidates = useMemo(() => buildKycEvidenceCandidates(application, documents, policy), [application, documents, policy]);
  const selected = scope && candidates.find((c) => c.type === scope.evidenceType && String(c.id) === String(scope.evidenceId));

  const close = () => { setDialog(null); setErrors({}); setReason(''); setChanges([emptyChange()]); };
  const field = (name) => (errors[`scopes.0.${name}`] || errors[`scopes.0.professionalReview.${name}`] || errors[name] || [])[0];

  const download = async (doc) => {
    const result = await action.run(async () => {
      const response = await kycService.downloadAdminKycDocument(request.id, doc);
      saveBlobDownload(response instanceof Blob ? { data: response, headers: null } : response, doc.originalName || 'kyc-document');
    });
    if (!result.ok) return;
  };
  const toggle = async (doc) => {
    setDocBusy(doc.id);
    await action.run(() => kycService.reviewAdminKycDocument(request.id, doc.id, !doc.reviewed));
    await detail.reload({ silent: true });
    setDocBusy(null);
  };
  const start = async () => {
    const result = await action.run(() => kycService.startAdminKycReview(request.id), { success: tr('بدأت مراجعة الطلب.', 'Review started.') });
    if (result.ok) reloadAll({ silent: true });
  };

  const openApprove = () => {
    setScope({
      role: application.domain === 'legal' ? 'Legal consultant' : 'Professional consultant', serviceTypes: ['written_consultation'], languages: [application.language || 'ar'], validUntil: '',
      evidenceType: '', evidenceId: '', jurisdictionCountry: '', regulator: '', registrationNumber: '', verificationSource: '', statusChecked: 'active', nextReviewAt: '',
    });
    setDialog('approve');
  };
  const submitApprove = async () => {
    const local = {};
    if (!scope.role.trim()) local['scopes.0.role'] = [tr('أدخل الدور المهني المعتمد.', 'Enter the approved professional role.')];
    if (!scope.serviceTypes.length) local['scopes.0.serviceTypes'] = [tr('اختر خدمة واحدة على الأقل.', 'Choose at least one service.')];
    if (!selected?.eligible) local['scopes.0.evidence'] = [tr('اختر دليلًا له مستند تمت مراجعته.', 'Choose evidence whose document was checked.')];
    if (regulated) {
      if (!/^[A-Za-z]{2}$/.test(scope.jurisdictionCountry.trim())) local['scopes.0.jurisdictionCountry'] = [tr('رمز البلد من حرفين.', 'Two-letter country code.')];
      if (!scope.regulator.trim()) local['scopes.0.professionalReview.regulator'] = [tr('أدخل الجهة المنظمة.', 'Enter the regulator.')];
      if (!scope.registrationNumber.trim()) local['scopes.0.professionalReview.registrationNumber'] = [tr('أدخل رقم التسجيل.', 'Enter the registration number.')];
      if (!isHttpsUrl(scope.verificationSource)) local['scopes.0.professionalReview.verificationSource'] = [tr('أدخل رابط HTTPS رسميًا.', 'Enter an official HTTPS link.')];
      if (!scope.nextReviewAt) local['scopes.0.professionalReview.nextReviewAt'] = [tr('حدد تاريخ المراجعة التالية.', 'Set the next review date.')];
    }
    setErrors(local);
    if (Object.keys(local).length) return;
    const result = await action.run(() => kycService.approveAdminKyc(request.id, [buildKycApprovalScope(application, scope, policy)]), { success: tr('تم اعتماد النطاق المهني.', 'The professional scope was approved.') });
    if (result.ok) { close(); reloadAll({ silent: true }); } else setErrors({ ...result.fieldErrors, _form: [result.message] });
  };
  const submitReject = async () => {
    if (reason.trim().length < 3) { setErrors({ reason: [tr('اكتب سبب الرفض (3 أحرف على الأقل).', 'Write the reason (at least 3 characters).')] }); return; }
    const result = await action.run(() => kycService.rejectAdminKyc(request.id, reason.trim()), { success: tr('تم رفض الطلب وإبلاغ الخبير.', 'The application was declined and the expert was notified.') });
    if (result.ok) { close(); reloadAll({ silent: true }); } else setErrors({ ...result.fieldErrors, _form: [result.message] });
  };
  const submitInfo = async () => {
    const local = {};
    if (reason.trim().length < 3) local.reason = [tr('اكتب ملخص الطلب (3 أحرف على الأقل).', 'Write a summary (at least 3 characters).')];
    const list = changes.map((c) => ({ section: c.section, ...(c.documentId ? { documentId: Number(c.documentId) } : {}), message: c.message.trim() })).filter((c) => c.message);
    if (!list.length || list.length !== changes.length) local.changes = [tr('أضف ملاحظة واضحة لكل بند.', 'Add a clear note to every item.')];
    setErrors(local);
    if (Object.keys(local).length) return;
    const result = await action.run(() => kycService.requestAdminKycInformation(request.id, reason.trim(), list), { success: tr('أُرسل طلب المعلومات إلى الخبير.', 'The information request was sent to the expert.') });
    if (result.ok) { close(); reloadAll({ silent: true }); } else setErrors({ ...result.fieldErrors, _form: [result.message] });
  };

  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!request) return <div className="ad-page"><Section icon="shieldCheck" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const meta = kycStatus(request.statusCode);
  const history = (request.history || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const toggleIn = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('التحقق من الخبراء', 'Expert verification'), to: PATHS.ADMIN_KYC }, { label: request.reference }]} />

      <Section className="ad-hero" icon="shieldCheck" title={tr('طلب تحقق', 'Verification application')} aside={<Status meta={meta} />}>
        <div className="ad-body">
          <KV columns={4} items={[
            [tr('الخبير', 'Expert'), request.name],
            [tr('البريد', 'Email'), <span dir="ltr">{request.email}</span>],
            [tr('المرجع', 'Reference'), <span className="ad-code">{request.reference}</span>],
            [tr('المحاولة', 'Attempt'), fmtNumber(application.attemptNumber || request.raw?.attemptNumber || 1)],
            [tr('المجال', 'Domain'), label(DOMAINS, application.domain)],
            [tr('الاختصاص', 'Jurisdiction'), <span dir="auto">{application.jurisdiction}</span>],
            [tr('تاريخ الإرسال', 'Submitted'), <When value={request.submittedAt} time />],
            [tr('المُراجِع', 'Reviewer'), request.reviewer?.name],
          ]} />
          {regulated && <Notice tone="warning">{tr('مجال منظَّم: الاعتماد يحتاج رخصة مهنية ساريّة ومصدر تحقق رسميًا، ويُمنح للبلد المحدد فقط.', 'Regulated domain: approval needs a valid professional licence and an official verification source, and applies to that country only.')}</Notice>}
          {request.decisionReason && request.statusCode !== 'verified' && <Notice tone={request.statusCode === 'rejected' ? 'danger' : 'warning'}><b>{tr('سبب القرار: ', 'Decision reason: ')}</b>{request.decisionReason}</Notice>}
        </div>
      </Section>

      <div className="ad-grid">
        <div className="ad-col-8 ad-stack">
          <Section icon="user" title={tr('الهوية ونطاق الممارسة', 'Identity & scope')}>
            <div className="ad-body"><KV items={[
              [tr('الاسم الكامل', 'Full name'), application.fullName],
              [tr('بلد الإقامة', 'Country'), label(COUNTRIES, application.country)],
              [tr('لغة التواصل', 'Language'), label(LANGUAGES, application.language)],
              [tr('جاهزية الدفعات', 'Payout readiness'), ({ not_ready: tr('غير جاهز', 'Not ready'), pending: tr('قيد الإعداد', 'In progress'), ready: tr('جاهز', 'Ready') })[request.raw?.payoutReadiness] || request.raw?.payoutReadiness],
            ]} /></div>
          </Section>

          <Section icon="briefcase" title={tr('الخبرة العملية', 'Experience')}>
            <div className="ad-body">
              {(application.experiences || []).length === 0 && <p className="ad-muted">{tr('لم يضف الخبير خبرات.', 'No experience was added.')}</p>}
              <ul className="ad-items">{(application.experiences || []).map((e) => (
                <li key={e.id}><b dir="auto">{e.jobTitle} — {e.organization}</b><small>{e.from} → {e.current ? tr('حتى الآن', 'present') : e.to}</small>{e.description && <p dir="auto" style={{ margin: '6px 0 0' }}>{e.description}</p>}</li>
              ))}</ul>
            </div>
          </Section>

          <Section icon="book" title={tr('المؤهلات والشهادات', 'Qualifications & credentials')}>
            <div className="ad-body">
              <ul className="ad-items">
                {(application.qualifications || []).map((q) => <li key={`q${q.id}`}><b dir="auto">{q.degree} — {q.field}</b><small dir="auto">{q.institution}{q.graduationYear ? ` · ${q.graduationYear}` : ''}</small></li>)}
                {(application.credentials || []).map((c) => <li key={`c${c.id}`}><b dir="auto">{c.name}</b><small dir="auto">{[c.type, c.issuer, c.expiryDate].filter(Boolean).join(' · ')}</small></li>)}
              </ul>
              {!(application.qualifications || []).length && !(application.credentials || []).length && <p className="ad-muted">{tr('لا مؤهلات أو شهادات مضافة.', 'No qualifications or credentials added.')}</p>}
            </div>
          </Section>

          <Section icon="paperclip" title={tr('المستندات', 'Documents')} aside={<span className="ad-muted">{tr(`${fmtNumber(checked)} من ${fmtNumber(documents.length)} روجعت`, `${fmtNumber(checked)} of ${fmtNumber(documents.length)} checked`)}</span>}>
            <div className="ad-body">
              <div className="ad-progress" role="progressbar" aria-valuemin={0} aria-valuemax={documents.length} aria-valuenow={checked}><i style={{ width: `${documents.length ? (checked / documents.length) * 100 : 0}%` }} /></div>
              {request.statusCode === 'submitted' && <Notice tone="info">{tr('ابدأ المراجعة أولًا لتتمكن من تأشير المستندات.', 'Start the review first to be able to mark documents.')}</Notice>}
              {documents.map((doc) => <DocumentRow key={doc.id} doc={doc} canReview={canReview} busy={docBusy} onToggle={toggle} onDownload={download} />)}
              {!documents.length && <p className="ad-muted">{tr('لا توجد مستندات مرفوعة.', 'No documents uploaded.')}</p>}
            </div>
          </Section>
        </div>

        <div className="ad-col-4 ad-stack">
          {(request.professionalReviews || []).length > 0 && (
            <Section icon="badgeCheck" title={tr('المراجعة المهنية المسجّلة', 'Recorded professional review')}>
              <div className="ad-body">{request.professionalReviews.map((r, i) => <KV key={i} columns={1} items={[[tr('الجهة المنظمة', 'Regulator'), r.regulator], [tr('رقم التسجيل', 'Registration no.'), r.registrationNumber], [tr('المراجعة التالية', 'Next review'), <When value={r.nextReviewAt} />]]} />)}</div>
            </Section>
          )}
          <Section icon="history" title={tr('سجل الحالة', 'Status history')}>
            <div className="ad-body"><Timeline empty={tr('لا يوجد سجل بعد.', 'No history yet.')} items={history.map((h, i) => ({ key: i, title: `${tx(kycStatus(h.from || 'draft').label)} → ${tx(kycStatus(h.to || h.status).label)}`, note: h.reason, at: h.createdAt, tone: ['verified'].includes(h.to) ? 'success' : ['rejected'].includes(h.to) ? 'danger' : undefined }))} /></div>
          </Section>
        </div>
      </div>

      {can(P.EXPERTS_REVIEW_KYC) && request.statusCode === 'submitted' && (
        <div className="ad-decide"><p>{tr('الطلب جاهز للمراجعة. عند البدء يُسجَّل اسمك كمُراجِع.', 'This application is ready. Starting the review records you as the reviewer.')}</p><Button icon="play" loading={action.busy} onClick={start}>{tr('بدء المراجعة', 'Start review')}</Button></div>
      )}
      {canReview && (
        <div className="ad-decide">
          <p>{allChecked ? tr('تمت مراجعة كل المستندات. يمكنك اتخاذ القرار.', 'All documents are checked. You can decide.') : tr(`راجع كل المستندات أولًا (${fmtNumber(checked)}/${fmtNumber(documents.length)}) قبل الاعتماد.`, `Check every document first (${fmtNumber(checked)}/${fmtNumber(documents.length)}) before approving.`)}</p>
          <div className="ad-actions">
            <Button variant="danger" icon="xCircle" onClick={() => setDialog('reject')}>{tr('رفض', 'Reject')}</Button>
            <Button variant="secondary" icon="message" onClick={() => setDialog('info')}>{tr('طلب معلومات', 'Request information')}</Button>
            <Button icon="badgeCheck" disabled={!allChecked || policy === 'unsupported'} onClick={openApprove}>{tr('اعتماد…', 'Approve…')}</Button>
          </div>
        </div>
      )}

      <ActionDialog open={dialog === 'reject'} onClose={close} icon="xCircle" tone="danger" title={tr('رفض طلب التحقق', 'Reject the application')} description={tr('سيصل سبب الرفض إلى الخبير ويمكنه البدء بمحاولة جديدة.', 'The expert receives the reason and can start a new attempt.')} confirmLabel={tr('رفض الطلب', 'Reject application')} variant="danger" busy={action.busy} onSubmit={submitReject} error={errors._form?.[0]}>
        <Field label={tr('سبب الرفض', 'Reason')} required error={errors.reason?.[0]} htmlFor="kyc-reject"><TextArea id="kyc-reject" value={reason} onChange={setReason} rows={4} invalid={Boolean(errors.reason)} maxLength={1000} /></Field>
      </ActionDialog>

      <ActionDialog open={dialog === 'info'} onClose={close} size="lg" icon="message" tone="peach" title={tr('طلب معلومات إضافية', 'Request more information')} description={tr('حدّد ما ينقص الطلب. يعدّل الخبير ويعيد الإرسال كمحاولة جديدة.', 'Say what is missing. The expert fixes it and resubmits as a new attempt.')} confirmLabel={tr('إرسال الطلب', 'Send request')} busy={action.busy} onSubmit={submitInfo} error={errors._form?.[0]}>
        <Field label={tr('ملخص للخبير', 'Summary for the expert')} required error={errors.reason?.[0]} htmlFor="kyc-info"><TextArea id="kyc-info" value={reason} onChange={setReason} rows={3} invalid={Boolean(errors.reason)} maxLength={1000} /></Field>
        <div className="ad-stack">
          {changes.map((change, index) => (
            <div className="ad-carditem" key={change.key}>
              <div className="ad-two">
                <Field label={tr('القسم', 'Section')} htmlFor={`sec-${index}`}><Select id={`sec-${index}`} value={change.section} onChange={(v) => setChanges(changes.map((c) => (c.key === change.key ? { ...c, section: v } : c)))} options={KYC_REVIEW_SECTIONS.map((s) => ({ value: s.value, label: tx([s.ar, s.en]) }))} /></Field>
                <Field label={tr('المستند (اختياري)', 'Document (optional)')} htmlFor={`doc-${index}`}><Select id={`doc-${index}`} value={String(change.documentId || 'none')} onChange={(v) => setChanges(changes.map((c) => (c.key === change.key ? { ...c, documentId: v === 'none' ? '' : v } : c)))} options={[{ value: 'none', label: tr('بدون', 'None') }, ...documents.map((d) => ({ value: String(d.id), label: d.originalName || `#${d.id}` }))]} /></Field>
              </div>
              <Field label={tr('ما المطلوب؟', 'What is needed?')} htmlFor={`msg-${index}`}><TextInput id={`msg-${index}`} value={change.message} onChange={(v) => setChanges(changes.map((c) => (c.key === change.key ? { ...c, message: v } : c)))} maxLength={500} /></Field>
              {changes.length > 1 && <Button variant="ghost" size="sm" icon="trash" onClick={() => setChanges(changes.filter((c) => c.key !== change.key))}>{tr('حذف البند', 'Remove item')}</Button>}
            </div>
          ))}
          {errors.changes && <Notice tone="danger">{errors.changes[0]}</Notice>}
          <Button variant="soft" size="sm" icon="plus" onClick={() => setChanges([...changes, emptyChange()])}>{tr('إضافة بند', 'Add item')}</Button>
        </div>
      </ActionDialog>

      {scope && (
        <ActionDialog open={dialog === 'approve'} onClose={close} size="lg" icon="badgeCheck" tone="success" title={tr('اعتماد نطاق مهني موثق', 'Approve a verified scope')} description={regulated ? tr('يُعتمد النطاق للبلد المحدد اعتمادًا على رخصة راجعتَها ومصدر تحقق رسمي. لا يعني اعتماد الخبير عالميًا.', 'Approved for the stated country only, based on a licence you checked and an official source. It does not make the expert approved worldwide.') : tr('يُعتمد النطاق اعتمادًا على الدليل المحدد من هذا الطلب.', 'Approved on the evidence you pick from this application.')} confirmLabel={tr('اعتماد النطاق', 'Approve scope')} busy={action.busy} onSubmit={submitApprove} error={errors._form?.[0]}>
          <div className="ad-two">
            <Field label={tr('الدور المهني', 'Professional role')} required error={field('role')} htmlFor="ap-role"><TextInput id="ap-role" value={scope.role} onChange={(v) => setScope({ ...scope, role: v })} invalid={Boolean(field('role'))} /></Field>
            <Field label={tr('صالح حتى (اختياري)', 'Valid until (optional)')} error={field('validUntil')} htmlFor="ap-valid"><TextInput id="ap-valid" type="date" value={scope.validUntil} onChange={(v) => setScope({ ...scope, validUntil: v })} /></Field>
          </div>
          <Field label={tr('أنواع الخدمة', 'Service types')} required error={field('serviceTypes')}>
            <div className="ad-chips">{Object.entries(SERVICE_TYPES).map(([id, text]) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={scope.serviceTypes.includes(id)} onClick={() => setScope({ ...scope, serviceTypes: toggleIn(scope.serviceTypes, id) })}>{tx(text)}</button>)}</div>
          </Field>
          <Field label={tr('لغات الخدمة', 'Service languages')} error={field('languages')}>
            <div className="ad-chips">{Object.entries(LANGUAGES).map(([id, text]) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={scope.languages.includes(id)} onClick={() => setScope({ ...scope, languages: toggleIn(scope.languages, id) })}>{tx(text)}</button>)}</div>
          </Field>
          <Field label={tr('الدليل المعتمد', 'Evidence')} required error={field('evidence')}>
            <div className="ad-radiolist">
              {candidates.length === 0 && <Notice tone="warning">{tr('لا يوجد دليل صالح في هذا الطلب.', 'This application has no usable evidence.')}</Notice>}
              {candidates.map((c) => (
                <label key={`${c.type}-${c.id}`} className={`ad-evidence${c.eligible ? '' : ' is-disabled'}`}>
                  <input type="radio" name="ap-evidence" disabled={!c.eligible} checked={scope.evidenceType === c.type && String(scope.evidenceId) === String(c.id)} onChange={() => setScope({ ...scope, evidenceType: c.type, evidenceId: c.id })} />
                  <span><b dir="auto">{c.label}</b><br /><small className="ad-muted" dir="auto">{c.description}{!c.eligible && c.reason ? ` — ${c.reason}` : ''}</small></span>
                </label>
              ))}
            </div>
          </Field>
          {regulated && (
            <>
              <div className="ad-two">
                <Field label={tr('بلد الترخيص (رمز من حرفين)', 'Licence country (2 letters)')} required error={field('jurisdictionCountry')} htmlFor="ap-country"><TextInput id="ap-country" value={scope.jurisdictionCountry} maxLength={2} onChange={(v) => setScope({ ...scope, jurisdictionCountry: v.toUpperCase() })} invalid={Boolean(field('jurisdictionCountry'))} /></Field>
                <Field label={tr('الجهة المنظمة', 'Regulator')} required error={field('regulator')} htmlFor="ap-reg"><TextInput id="ap-reg" value={scope.regulator} onChange={(v) => setScope({ ...scope, regulator: v })} invalid={Boolean(field('regulator'))} /></Field>
                <Field label={tr('رقم التسجيل المهني', 'Registration number')} required error={field('registrationNumber')} htmlFor="ap-no"><TextInput id="ap-no" value={scope.registrationNumber} onChange={(v) => setScope({ ...scope, registrationNumber: v })} invalid={Boolean(field('registrationNumber'))} /></Field>
                <Field label={tr('المراجعة التالية', 'Next review')} required error={field('nextReviewAt')} htmlFor="ap-next"><TextInput id="ap-next" type="date" value={scope.nextReviewAt} onChange={(v) => setScope({ ...scope, nextReviewAt: v })} invalid={Boolean(field('nextReviewAt'))} /></Field>
              </div>
              <Field label={tr('رابط مصدر التحقق (HTTPS)', 'Verification source (HTTPS)')} required error={field('verificationSource')} htmlFor="ap-src"><TextInput id="ap-src" dir="ltr" value={scope.verificationSource} onChange={(v) => setScope({ ...scope, verificationSource: v })} placeholder="https://" invalid={Boolean(field('verificationSource'))} /></Field>
            </>
          )}
        </ActionDialog>
      )}
    </div>
  );
}

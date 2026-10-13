import React, { useRef, useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../../api/errorHandler';
import { useIdempotentAction, useResource } from '../../../../services/hooks';
import { expertRenewalsService } from '../../../../services/expert/expertWorkService';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, Card, CardHeader, Chip, Dialog, EmptyState, Field, SkeletonRows, StatusPill, TextArea } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { ResourceError, fieldErrors } from '../../common/parts';
import { DOMAIN_LABEL, RENEWAL_STATUS, ROLE_LABEL, SCOPE_STATUS, SERVICE_MODE_LABEL } from '../../utils/expertStatuses';

const OPEN = ['draft', 'submitted', 'under_review', 'needs_information'];
const daysLeft = (date) => Math.ceil((new Date(date) - Date.now()) / 86400000);

function RenewalDialog({ scope, renewal, onClose, onDone }) {
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const start = useIdempotentAction('renewal');
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async () => {
    if (!file) { setError(tr('أرفق وثيقة حديثة تثبت سريان الترخيص.', 'Attach a recent document proving the licence is valid.')); return; }
    setBusy(true); setError('');
    try {
      let current = renewal;
      if (!current) { const r = await start.run(({ idempotencyKey }) => expertRenewalsServiceStart(scope.id, idempotencyKey)); if (!r.ok) throw r.error; current = r.data; }
      const withEvidence = await expertRenewalsService.addEvidence(current.id, { version: current.version, file, note });
      await expertRenewalsService.submit(current.id, withEvidence.version);
      notify({ message: tr('أُرسل طلب التجديد للمراجعة.', 'Renewal sent for review.'), tone: 'success' }); onDone();
    } catch (e) { const f = fieldErrors(e); setError(f.file || f.evidence || getErrorMessage(e)); onDone(true); } finally { setBusy(false); }
  };
  return (
    <Dialog open onClose={busy ? () => {} : onClose} size="sm" icon="refresh" title={tr('تجديد النطاق المهني', 'Renew your scope')} description={`${tx(DOMAIN_LABEL[scope.domain] || [scope.domain, scope.domain])} · ${scope.jurisdiction}`}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="send" loading={busy} onClick={send}>{tr('إرسال للمراجعة', 'Send for review')}</Button></>}>
      {renewal?.feedback?.reason && <div className="jr-banner is-warning"><UdIcon name="info" size={18} /><span>{renewal.feedback.reason}</span></div>}
      <Field label={tr('وثيقة حديثة', 'Recent document')} required error={error} hint={tr('رخصة سارية أو شهادة قيد حديثة (PDF أو صورة).', 'A valid licence or a recent registration certificate (PDF or image).')}>
        <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button type="button" variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>{file ? file.name : tr('اختر ملفًا', 'Choose a file')}</Button>
      </Field>
      <Field label={tr('ملاحظة للمراجع', 'Note for the reviewer')} optional htmlFor="rn-note"><TextArea id="rn-note" rows={3} value={note} onChange={setNote} maxLength={300} /></Field>
    </Dialog>
  );
}
const expertRenewalsServiceStart = (scopeId, idempotencyKey) => expertRenewalsService.start(scopeId, { idempotencyKey });

/** Verified professional scopes and their yearly renewal. */
export default function ScopesTab() {
  const { tr, tx, fmtDate } = useUserI18n();
  const scopes = useResource(() => expertRenewalsService.scopes(), []);
  const renewals = useResource(() => expertRenewalsService.list(), []);
  const [dialog, setDialog] = useState(null);
  const reload = () => { scopes.reload({ silent: true }); renewals.reload({ silent: true }); };
  const openRenewal = (scopeId) => (renewals.data || []).find((r) => r.scopeId === scopeId && OPEN.includes(r.status));

  return (
    <>
      <ResourceError resource={scopes} />
      {scopes.loading && !scopes.data && <Card className="jr-card"><SkeletonRows rows={2} /></Card>}
      {scopes.data && scopes.data.length === 0 && <Card className="jr-card"><EmptyState icon="shieldCheck" title={tr('لا توجد نطاقات موثّقة', 'No verified scopes')} description={tr('تظهر بعد اعتماد طلب التوثيق.', 'They appear once your verification is approved.')} /></Card>}
      {(scopes.data || []).map((scope) => {
        const status = SCOPE_STATUS[scope.status] || SCOPE_STATUS.active;
        const left = daysLeft(scope.validUntil);
        const open = openRenewal(scope.id);
        const soon = left <= 30 && !open;
        return (
          <Card key={scope.id} className="jr-card jr-block">
            <CardHeader icon="shieldCheck" title={`${tx(DOMAIN_LABEL[scope.domain] || [scope.domain, scope.domain])} · ${scope.jurisdiction}`} aside={<StatusPill tone={status.tone}>{tx(status.label)}</StatusPill>} />
            <div className="ex-chips"><Chip icon="briefcase">{tx(ROLE_LABEL[scope.role] || [scope.role, scope.role])}</Chip>{scope.serviceTypes.map((m) => <Chip key={m}>{tx(SERVICE_MODE_LABEL[m] || [m, m])}</Chip>)}</div>
            <p className="jr-lead">{tr(`ساري حتى ${fmtDate(scope.validUntil)}`, `Valid until ${fmtDate(scope.validUntil)}`)}</p>
            {soon && <div className="jr-banner is-warning"><UdIcon name="clock" size={18} /><span>{tr(`ينتهي خلال ${left} يومًا. جدّده كي تستمر في استقبال الطلبات.`, `Expires in ${left} days. Renew it to keep getting requests.`)}</span></div>}
            {open
              ? <div className="ex-renewal"><StatusPill tone={RENEWAL_STATUS[open.status].tone}>{tx(RENEWAL_STATUS[open.status].label)}</StatusPill>
                {open.status === 'draft' || open.status === 'needs_information' ? <Button size="sm" icon="upload" onClick={() => setDialog({ scope, renewal: open })}>{tr('أرفق وأرسل', 'Attach and send')}</Button> : <small>{tr('بانتظار قرار المراجع.', 'Waiting for the reviewer.')}</small>}</div>
              : <div className="jr-actions jr-actions--start"><Button size="sm" variant={soon ? 'primary' : 'secondary'} icon="refresh" onClick={() => setDialog({ scope })}>{tr('تجديد', 'Renew')}</Button></div>}
          </Card>
        );
      })}
      {(renewals.data || []).length > 0 && (
        <Card className="jr-card jr-block">
          <CardHeader icon="history" title={tr('طلبات التجديد', 'Renewal requests')} />
          <ul className="jr-rows">{renewals.data.map((r) => (
            <li key={r.id}><span className="jr-rows__copy"><b>{tr(`طلب تجديد #${r.id}`, `Renewal #${r.id}`)}</b><small>{fmtDate(r.updatedAt)}</small></span><StatusPill tone={RENEWAL_STATUS[r.status].tone}>{tx(RENEWAL_STATUS[r.status].label)}</StatusPill></li>
          ))}</ul>
        </Card>
      )}
      {dialog && <RenewalDialog scope={dialog.scope} renewal={dialog.renewal} onClose={() => setDialog(null)} onDone={(keepOpen) => { reload(); if (!keepOpen) setDialog(null); }} />}
    </>
  );
}

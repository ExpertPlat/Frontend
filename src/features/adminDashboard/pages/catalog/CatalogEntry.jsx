import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminCatalog } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs, Button, Field, Select } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, KV, LoadFailed, Notice, Section, Status, When, useAdminAction, useLabel } from '../../ui/kit';
import { CATALOG_COUNTRIES, CATALOG_STATUS, CLOSED_STATUSES, DOMAINS, LIVE_STATUSES, REASON_CODES, SERVICE_TYPES } from '../../ui/statuses';

const toggle = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

function ImpactPanel({ impact, loading, error }) {
  const { tr, fmtNumber } = useUserI18n();
  if (loading) return <p className="ad-muted" aria-busy="true">{tr('جارٍ حساب الأثر…', 'Calculating impact…')}</p>;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!impact) return null;
  const rows = [[impact.openCases, tr('حالات مفتوحة', 'Open cases')], [impact.waitingCases, tr('حالات تنتظر خبراء', 'Waiting cases')], [impact.activeOfferings, tr('خدمات منشورة للخبراء', 'Published offerings')], [impact.activeGrants, tr('صلاحيات فعّالة', 'Active grants')]];
  return <div className="ad-impact">{rows.map(([n, text]) => <div key={text}><b>{fmtNumber(n)}</b><small>{text}</small></div>)}</div>;
}

/** One catalog service: its versions with the review → publish / pause workflow. Publishing and pausing need the impact token (the API rejects a stale one). */
export default function CatalogEntry() {
  const { entryId } = useParams();
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const detail = useResource(() => adminCatalog.entry(entryId), [entryId]);
  const action = useAdminAction(detail.reload);
  const [dialog, setDialog] = useState(null);
  const [impact, setImpact] = useState({ data: null, loading: false, error: '' });
  const [error, setError] = useState('');
  const entry = detail.data;

  const close = () => { setDialog(null); setError(''); setImpact({ data: null, loading: false, error: '' }); };
  const openWithImpact = async (kind, version, extra) => {
    setError(''); setDialog({ kind, version, ...extra });
    if (!can(P.CATALOG_VIEW_IMPACT)) { setImpact({ data: null, loading: false, error: tr('لا تملك صلاحية عرض الأثر المطلوبة للنشر أو الإيقاف.', 'You lack the impact permission needed to publish or pause.') }); return; }
    setImpact({ data: null, loading: true, error: '' });
    try { setImpact({ data: await adminCatalog.impact(version.id), loading: false, error: '' }); } catch (e) { setImpact({ data: null, loading: false, error: e?.payload?.message || tr('تعذّر حساب الأثر.', 'Could not calculate the impact.') }); }
  };

  const run = async (call, success) => {
    const res = await action.run(call, { success });
    if (res.ok) { close(); detail.reload({ silent: true }); } else setError(res.message);
  };
  const submit = () => {
    const { kind, version } = dialog;
    if (kind === 'review') return run(() => adminCatalog.review(version.id, { expectedVersion: version.version, approved: true, reasonCode: dialog.reasonCode }), tr('تمت مراجعة النسخة.', 'Version reviewed.'));
    if (kind === 'publish') return run(() => adminCatalog.publish(version.id, { expectedVersion: version.version, status: dialog.status, impactToken: impact.data?.impactToken }), tr('نُشرت النسخة.', 'Version published.'));
    if (kind === 'pause') return run(() => adminCatalog.pause(version.id, { expectedVersion: version.version, status: dialog.status, reasonCode: dialog.reasonCode, impactToken: impact.data?.impactToken }), tr('تم تغيير حالة النسخة.', 'Version status changed.'));
    if (kind === 'new') return run(() => adminCatalog.createVersion(entry.id, { expectedVersion: entry.latestVersion.version, policy: { ...entry.latestVersion.policy, deliveryModes: dialog.deliveryModes, jurisdictionCodes: dialog.jurisdictionCodes } }), tr('أُنشئت نسخة جديدة كمسودة.', 'A new draft version was created.'));
    return null;
  };

  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!entry) return <div className="ad-page"><Section icon="layers" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;

  const versions = entry.versions.slice().sort((a, b) => b.catalogVersion - a.catalogVersion);
  const openDraft = versions.some((v) => ['draft', 'reviewed'].includes(v.status));
  const dk = dialog?.kind;
  const needsImpact = dk === 'publish' || dk === 'pause';
  const reasonOptions = Object.entries(REASON_CODES).filter(([k]) => !k.startsWith('LICENCE')).map(([value, text]) => ({ value, label: tx(text) }));

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('الكتالوج والخدمات', 'Catalog & services'), to: PATHS.ADMIN_CATALOG }, { label: tx([entry.labels.ar, entry.labels.en]) }]} />
      <Section className="ad-hero" icon="layers" title={<span dir="auto">{tx([entry.labels.ar, entry.labels.en])}</span>} aside={<Status map={CATALOG_STATUS} value={entry.status} />}>
        <div className="ad-body">
          {entry.summary && (entry.summary.ar || entry.summary.en) && <p className="ad-quote" dir="auto">{tx([entry.summary.ar, entry.summary.en])}</p>}
          <KV columns={4} items={[[tr('الرمز', 'Code'), <span className="ad-code">{entry.code}</span>], [tr('المجال', 'Domain'), label(DOMAINS, entry.domain)], [tr('عدد النسخ', 'Versions'), entry.versionsCount], [tr('الحالة الحالية للمستخدمين', 'Live for users'), <Status map={CATALOG_STATUS} value={entry.status} />]]} />
          {can(P.CATALOG_MANAGE_DRAFTS) && <div><Button size="sm" variant="secondary" icon="plus" disabled={openDraft} onClick={() => { setError(''); setDialog({ kind: 'new', deliveryModes: entry.latestVersion.policy.deliveryModes || [], jurisdictionCodes: entry.latestVersion.policy.jurisdictionCodes || [] }); }}>{tr('نسخة جديدة', 'New version')}</Button>{openDraft && <small className="ad-muted" style={{ marginInlineStart: 10 }}>{tr('أنهِ النسخة المفتوحة أولًا.', 'Finish the open version first.')}</small>}</div>}
        </div>
      </Section>

      <Section flush icon="history" title={tr('النسخ وسير العمل', 'Versions & workflow')}>
        <ul className="ad-versions">
          {versions.map((v) => {
            const live = LIVE_STATUSES.includes(v.status);
            return (
              <li key={v.id}>
                <header><b>v{v.catalogVersion}</b><Status map={CATALOG_STATUS} value={v.status} /><small className="ad-muted">{v.publishedAt ? <>{tr('نُشرت', 'Published')} <When value={v.publishedAt} /></> : v.reviewedAt ? <>{tr('روجعت', 'Reviewed')} <When value={v.reviewedAt} /></> : <>{tr('أُنشئت', 'Created')} <When value={v.createdAt} /></>}</small></header>
                <div className="ad-policy">
                  {(v.policy?.deliveryModes || []).map((m) => <span key={m}>{label(SERVICE_TYPES, m)}</span>)}
                  {(v.policy?.jurisdictionCodes || []).map((j) => <span key={j}>{j}</span>)}
                  {v.policy?.requiresVerifiedScope && <span>{tr('يتطلب نطاقًا معتمدًا', 'Needs a verified scope')}</span>}
                </div>
                <div className="ad-actions">
                  {v.status === 'draft' && can(P.CATALOG_REVIEW) && <Button size="sm" icon="checkCircle" onClick={() => { setError(''); setDialog({ kind: 'review', version: v, reasonCode: 'POLICY_VERIFIED' }); }}>{tr('اعتماد المراجعة', 'Complete review')}</Button>}
                  {['reviewed', 'paused'].includes(v.status) && can(P.CATALOG_PUBLISH) && <Button size="sm" icon="play" onClick={() => openWithImpact('publish', v, { status: 'pilot' })}>{v.status === 'paused' ? tr('إعادة التفعيل', 'Re-enable') : tr('نشر', 'Publish')}</Button>}
                  {live && can(P.CATALOG_PAUSE) && <Button size="sm" variant="danger" icon="pause" onClick={() => openWithImpact('pause', v, { status: 'paused', reasonCode: 'SAFETY_REVIEW' })}>{tr('إيقاف', 'Pause')}</Button>}
                  {v.reviewReasonCode && <small className="ad-muted">{label(REASON_CODES, v.reviewReasonCode)}</small>}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {dialog && (
        <ActionDialog open onClose={close} size={dk === 'new' ? 'lg' : 'md'}
          icon={dk === 'pause' ? 'pause' : dk === 'publish' ? 'play' : dk === 'new' ? 'plus' : 'checkCircle'} tone={dk === 'pause' ? 'danger' : 'success'}
          title={{ review: tr('اعتماد مراجعة النسخة', 'Complete the version review'), publish: tr('نشر النسخة', 'Publish the version'), pause: tr('إيقاف النسخة', 'Pause the version'), new: tr('نسخة جديدة', 'New version') }[dk]}
          description={dk === 'new' ? tr('تبدأ كمسودة من سياسة آخر نسخة، وتحتاج مراجعة قبل النشر.', 'Starts as a draft from the latest policy; it needs review before publishing.') : tx(entry.labels.ar ? [entry.labels.ar, entry.labels.en] : entry.code)}
          confirmLabel={{ review: tr('اعتماد', 'Confirm'), publish: tr('نشر', 'Publish'), pause: tr('تأكيد الإيقاف', 'Confirm'), new: tr('إنشاء المسودة', 'Create draft') }[dk]}
          variant={dk === 'pause' ? 'danger' : 'primary'} busy={action.busy} canSubmit={!needsImpact || Boolean(impact.data)} onSubmit={submit} error={error}>
          {needsImpact && <><p className="ad-muted" style={{ margin: 0 }}>{tr('هذا أثر القرار الآن. يُرسل رمز الأثر مع الطلب، وإن تغيّر الوضع قبل التنفيذ سيُرفض الطلب لتراجعه من جديد.', 'This is the impact right now. Its token is sent with the request; if things change before it runs, the request is rejected so you can review again.')}</p><ImpactPanel {...impact} /></>}
          {dk === 'review' && <Field label={tr('سبب المراجعة', 'Review reason')} htmlFor="ce-reason"><Select id="ce-reason" value={dialog.reasonCode} onChange={(v) => setDialog({ ...dialog, reasonCode: v })} options={reasonOptions} /></Field>}
          {dk === 'publish' && <Field label={tr('وضع النشر', 'Publish as')} htmlFor="ce-pub"><Select id="ce-pub" value={dialog.status} onChange={(v) => setDialog({ ...dialog, status: v })} options={LIVE_STATUSES.map((v) => ({ value: v, label: tx(CATALOG_STATUS[v].label) }))} /></Field>}
          {dk === 'pause' && (
            <div className="ad-two">
              <Field label={tr('الحالة الجديدة', 'New status')} htmlFor="ce-ps"><Select id="ce-ps" value={dialog.status} onChange={(v) => setDialog({ ...dialog, status: v })} options={CLOSED_STATUSES.map((v) => ({ value: v, label: tx(CATALOG_STATUS[v].label) }))} /></Field>
              <Field label={tr('السبب', 'Reason')} htmlFor="ce-pr"><Select id="ce-pr" value={dialog.reasonCode} onChange={(v) => setDialog({ ...dialog, reasonCode: v })} options={reasonOptions} /></Field>
            </div>
          )}
          {dk === 'new' && (
            <>
              <Field label={tr('أنماط التقديم', 'Delivery modes')}><div className="ad-chips">{Object.entries(SERVICE_TYPES).map(([id, text]) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={dialog.deliveryModes.includes(id)} onClick={() => setDialog({ ...dialog, deliveryModes: toggle(dialog.deliveryModes, id) })}>{tx(text)}</button>)}</div></Field>
              <Field label={tr('الدول المتاحة', 'Available countries')}><div className="ad-chips">{CATALOG_COUNTRIES.map((id) => <button key={id} type="button" className="ad-chip-toggle" aria-pressed={dialog.jurisdictionCodes.includes(id)} onClick={() => setDialog({ ...dialog, jurisdictionCodes: toggle(dialog.jurisdictionCodes, id) })}>{id}</button>)}</div></Field>
            </>
          )}
        </ActionDialog>
      )}
    </div>
  );
}

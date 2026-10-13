import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { adminOversight } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Breadcrumbs } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { KV, LoadFailed, Money, Section, Status, Timeline, When, useLabel } from '../../ui/kit';
import { AGREEMENT_STATUS, BOOKING_STATUS, CASE_STATUS, CASE_TIMELINE, COUNTRIES, DOMAINS, FUNDING_STATUS, INVITATION_STATUS, LANGUAGES, PROPOSAL_STATUS, SCAN_STATUS } from '../../ui/statuses';

const sizeOf = (bytes) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))} KB`);

const Mini = ({ icon, title, rows, empty, render }) => (
  <Section flush icon={icon} title={title}>
    {rows.length === 0 ? <div className="ad-pad ad-muted">{empty}</div> : <ul className="ad-mini">{rows.map(render)}</ul>}
  </Section>
);

/** Read-only dossier of one case: summary, stage, parties, money and a timeline built from the API's events. */
export default function CaseDetail() {
  const { caseId } = useParams();
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can } = useAdminSession();
  const detail = useResource(() => adminOversight.case(caseId), [caseId]);
  const c = detail.data;
  if (detail.error) return <div className="ad-page"><LoadFailed message={detail.errorMessage} onRetry={() => detail.reload()} /></div>;
  if (!c) return <div className="ad-page"><Section icon="file" title={tr('جارٍ التحميل…', 'Loading…')}><div className="ad-body" aria-busy="true">…</div></Section></div>;
  const expertLink = (ex) => (can(P.EXPERTS_VIEW) ? <Link to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: ex.id })}>{ex.name}</Link> : <b>{ex.name}</b>);

  return (
    <div className="ad-page">
      <Breadcrumbs items={[{ label: tr('الحالات', 'Cases'), to: PATHS.ADMIN_CASES }, { label: `#${c.id}` }]} />
      <Section className="ad-hero" icon="file" title={<span dir="auto">{c.title}</span>} aside={<Status map={CASE_STATUS} value={c.status} />}>
        <div className="ad-body">
          {c.summary && <blockquote className="ad-quote" dir="auto">{c.summary}</blockquote>}
          <KV columns={4} items={[
            [tr('المستخدم', 'User'), can(P.USERS_VIEW) ? <Link to={withParams(PATHS.ADMIN_USER_DETAIL, { userId: c.user.id })}>{c.user.name}</Link> : c.user.name],
            [tr('المجال', 'Domain'), label(DOMAINS, c.domain)], [tr('بلد الحالة', 'Case country'), label(COUNTRIES, c.caseCountry)], [tr('لغة الحالة', 'Language'), label(LANGUAGES, c.language)],
            [tr('الاستعجال', 'Urgency'), c.urgency], [tr('أُنشئت', 'Created'), <When value={c.createdAt} />], [tr('أُرسلت', 'Submitted'), <When value={c.submittedAt} />], [tr('آخر تحديث', 'Updated'), <When value={c.updatedAt} time />],
          ]} />
        </div>
      </Section>

      <div className="ad-grid">
        <div className="ad-col-7 ad-stack">
          <Mini icon="users" title={tr('الدعوات', 'Invitations')} rows={c.invitations} empty={tr('لم تُرسل دعوات.', 'No invitations sent.')} render={(i) => (
            <li key={i.id}><div>{expertLink(i.expert)}<small>{tr('أُرسلت', 'Sent')} <When value={i.sentAt} /></small></div><Status map={INVITATION_STATUS} value={i.status} /></li>
          )} />
          <Mini icon="fileCheck" title={tr('العروض', 'Proposals')} rows={c.proposals} empty={tr('لا عروض.', 'No proposals.')} render={(p) => (
            <li key={p.id}><div>{expertLink(p.expert)}<small>{tr(`النسخة ${p.versionNo}`, `Version ${p.versionNo}`)} · <Money minor={p.amount.amountMinor} currency={p.amount.currency} /></small></div><Status map={PROPOSAL_STATUS} value={p.status} /></li>
          )} />
          <Mini icon="fileSign" title={tr('الاتفاقيات والتمويل', 'Agreements & funding')} rows={c.agreements} empty={tr('لا اتفاقيات.', 'No agreements.')} render={(a) => {
            const f = c.fundings[0];
            return (
              <li key={a.id}><div>{expertLink(a.expert)}<small><Money minor={a.amount?.amountMinor} currency={a.amount?.currency} strong /></small></div>
                <span className="ad-row"><Status map={AGREEMENT_STATUS} value={a.status} />{f && (can(P.FINANCE_VIEW) ? <Link to={withParams(PATHS.ADMIN_FUNDING_DETAIL, { fundingId: f.id })}><Status map={FUNDING_STATUS} value={f.status} /></Link> : <Status map={FUNDING_STATUS} value={f.status} />)}</span></li>
            );
          }} />
          <Mini icon="calendar" title={tr('الجلسات', 'Sessions')} rows={c.bookings} empty={tr('لا جلسات.', 'No sessions.')} render={(b) => (
            <li key={b.id}><div>{expertLink(b.expert)}<small><When value={b.startsAt} time /></small></div><Status map={BOOKING_STATUS} value={b.status} /></li>
          )} />
          <Mini icon="paperclip" title={tr('المستندات', 'Documents')} rows={c.documents} empty={tr('لا مستندات.', 'No documents.')} render={(d) => (
            <li key={d.id}><div><b dir="auto">{d.title}</b><small>{sizeOf(d.size)} · <When value={d.createdAt} /></small></div><Status map={SCAN_STATUS} value={d.scanStatus} /></li>
          )} />
        </div>
        <div className="ad-col-5 ad-stack">
          {c.scopes.length > 0 && (
            <Section icon="scale" title={tr('نطاقات الحالة', 'Case scopes')}>
              <div className="ad-body"><ul className="ad-items">{c.scopes.map((s) => <li key={s.id}><b dir="auto">{tx(s.label)}</b><small>{s.priority} · {s.included ? tr('مشمول', 'Included') : tr('غير مشمول', 'Not included')}</small></li>)}</ul></div>
            </Section>
          )}
          <Section icon="history" title={tr('الخط الزمني', 'Timeline')}>
            <div className="ad-body"><Timeline empty={tr('لا أحداث.', 'No events.')} items={c.timeline.map((t, i) => ({ key: i, title: tx(CASE_TIMELINE[t.action] || [t.action, t.action]), note: t.label, at: t.at, tone: t.action === 'case.cancelled' ? 'danger' : t.action === 'session.completed' ? 'success' : undefined }))} /></div>
          </Section>
        </div>
      </div>
    </div>
  );
}

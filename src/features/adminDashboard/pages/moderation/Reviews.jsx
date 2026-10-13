import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminOversight } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import UdIcon from '../../../userDashboard/components/UdIcon';
import { Button, EmptyState, Field, PageHeader, TextArea } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { ActionDialog, FilterBar, LoadFailed, Pager, Rating, SearchBox, Section, Status, Tabs, When, useAdminAction, usePagedList } from '../../ui/kit';
import { MODERATION_ACTION, MODERATION_STATUS } from '../../ui/statuses';

const TABS = ['pending_moderation', 'published', 'hidden', 'rejected', ''];

export default function Reviews() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const { can, queues, refreshQueues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const list = usePagedList((q) => adminOversight.reviews(q), { search: '', status: params.has('status') ? params.get('status') : 'pending_moderation' });
  const action = useAdminAction(list.reload);
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const changeStatus = (value) => { list.setFilter('status', value); setParams({ status: value }, { replace: true }); };
  const close = () => { setDialog(null); setNote(''); setError(''); };
  const submit = async () => {
    const res = await action.run(() => adminOversight.moderateReview(dialog.review.id, { status: dialog.to, expectedVersion: dialog.review.version, ...(note.trim() ? { note: note.trim() } : {}) }), { success: tr('تم تحديث حالة التقييم.', 'Review status updated.') });
    if (res.ok) { close(); list.reload({ silent: true }); refreshQueues(); } else setError(res.message);
  };
  const moderate = can(P.REVIEWS_MODERATE);

  return (
    <div className="ad-page">
      <PageHeader icon="star" title={tr('إشراف التقييمات', 'Review moderation')} subtitle={tr('لا يظهر التقييم في ملف الخبير العام إلا بعد نشره. أي قرار هنا ينعكس فورًا على الملف العام وتقييم الخبير.', 'A review only appears on the public profile once it is published. Any decision here is reflected immediately on the profile and the expert’s rating.')} />
      <Tabs label={tr('حالة التقييم', 'Review status')} value={list.filters.status} onChange={changeStatus} tabs={TABS.map((value) => ({ id: value, label: value ? tx(MODERATION_STATUS[value].label) : tr('الكل', 'All'), count: value === 'pending_moderation' && queues.reviews > 0 ? fmtNumber(queues.reviews) : null }))} />
      <Section flush icon="list" title={tr('التقييمات', 'Reviews')}>
        <FilterBar><SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث في النص أو الأسماء', 'Search text or names')} /></FilterBar>
        {list.error ? <div className="ad-pad"><LoadFailed message={list.error?.payload?.message || tr('تعذّر تحميل التقييمات.', 'Could not load the reviews.')} onRetry={() => list.reload()} /></div> : null}
        {!list.error && list.items.length === 0 && !list.loading && <div className="ad-pad"><EmptyState icon="star" title={tr('لا توجد تقييمات هنا', 'No reviews here')} description={tr('عندما يقيّم مستخدم خبيرًا بعد جلسته سيظهر التقييم في هذه القائمة.', 'When a user rates an expert after a session, the review shows up here.')} /></div>}
        <ul className="ad-reviews">
          {list.items.map((r) => (
            <li key={r.id} className={r.flagged ? 'is-flagged' : undefined}>
              <header>
                <Rating value={r.rating} />
                <Status map={MODERATION_STATUS} value={r.status} />
                {r.flagged && <span className="ud-pill-status is-danger"><i />{tr('مُبلَّغ عنه', 'Flagged')}</span>}
                <small className="ad-muted"><When value={r.createdAt} /></small>
              </header>
              <p dir="auto">{r.body}</p>
              {r.flagged && <p className="ad-notice is-danger"><UdIcon name="alert" size={16} /><span>{r.flagReason === 'contains_personal_data' ? tr('يحتوي على بيانات شخصية (رقم هاتف).', 'Contains personal data (a phone number).') : r.flagReason}</span></p>}
              {r.moderationNote && <p className="ad-muted"><b>{tr('ملاحظة الإشراف: ', 'Moderation note: ')}</b>{r.moderationNote}</p>}
              <footer>
                <span className="ad-muted">
                  {tr('على', 'On')} {can(P.EXPERTS_VIEW) ? <Link className="ad-link" to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: r.expert.id })}>{r.expert.name}</Link> : <b>{r.expert.name}</b>}
                  {' · '}{tr('من', 'by')} <b>{r.reviewer.name}</b>
                  {r.caseTitle && <> · {can(P.CASES_VIEW) ? <Link className="ad-link" to={withParams(PATHS.ADMIN_CASE_DETAIL, { caseId: r.caseId })} dir="auto">{r.caseTitle}</Link> : <span dir="auto">{r.caseTitle}</span>}</>}
                </span>
                {moderate && r.allowedTransitions.length > 0 && (
                  <span className="ad-actions">
                    {r.allowedTransitions.map((to) => {
                      const meta = MODERATION_ACTION[to];
                      return <Button key={to} size="sm" variant={meta.variant} icon={meta.icon} onClick={() => { setError(''); setDialog({ review: r, to }); }}>{tx(meta.label)}</Button>;
                    })}
                  </span>
                )}
              </footer>
            </li>
          ))}
        </ul>
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>

      {dialog && (
        <ActionDialog open onClose={close} icon={MODERATION_ACTION[dialog.to].icon} tone={dialog.to === 'rejected' ? 'danger' : 'success'} title={`${tx(MODERATION_ACTION[dialog.to].label)} ${tr('التقييم', 'the review')}`} description={<span dir="auto">{dialog.review.body}</span>} confirmLabel={tx(MODERATION_ACTION[dialog.to].label)} variant={MODERATION_ACTION[dialog.to].variant === 'danger' ? 'danger' : 'primary'} busy={action.busy} onSubmit={submit} error={error}>
          <Field label={tr('ملاحظة الإشراف', 'Moderation note')} optional hint={tr('تُحفظ للفريق ولا تُعرض للجمهور.', 'Kept for the team; not shown publicly.')} htmlFor="rv-note"><TextArea id="rv-note" value={note} onChange={setNote} rows={3} maxLength={1000} /></Field>
        </ActionDialog>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminOversight } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, Dialog, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, FilterSelect, KV, Notice, Pager, Person, SearchBox, Section, Status, Tabs, When, useLabel, usePagedList } from '../../ui/kit';
import { DATA_REQUEST_REASON, DATA_REQUEST_STATUS, DATA_REQUEST_TYPE } from '../../ui/statuses';

const TABS = ['', 'requested', 'processing', 'deferred', 'completed', 'rejected'];
const OPEN = ['requested', 'processing'];
const overdue = (r) => OPEN.includes(r.status) && r.dueAt && new Date(r.dueAt) < new Date();

/** Data-subject requests (export / deletion) — GET /api/admin/data-requests. Read-only: the privacy team works them in the processing pipeline. */
export default function Privacy() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { can, queues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const list = usePagedList((q) => adminOversight.dataRequests(q), { search: '', status: params.get('status') || '', type: '' });
  const [open, setOpen] = useState(null);
  const changeStatus = (value) => { list.setFilter('status', value); setParams(value ? { status: value } : {}, { replace: true }); };
  const lateCount = list.items.filter(overdue).length;

  return (
    <div className="ad-page">
      <PageHeader icon="fingerprint" title={tr('الخصوصية والبيانات', 'Privacy & data')} subtitle={tr('طلبات المستخدمين لتصدير بياناتهم أو حذف حساباتهم، مع مواعيدها النهائية وأسباب التأجيل أو الرفض.', 'Users’ requests to export their data or delete their accounts, with deadlines and the reasons for deferral or refusal.')} />
      <Tabs label={tr('حالة الطلب', 'Request status')} value={list.filters.status} onChange={changeStatus} tabs={TABS.map((value) => ({ id: value, label: value ? tx(DATA_REQUEST_STATUS[value].label) : tr('الكل', 'All'), count: value === 'requested' && queues.privacy > 0 ? fmtNumber(queues.privacy) : null }))} />
      {lateCount > 0 && <Notice tone="danger">{tr(`${fmtNumber(lateCount)} طلب تجاوز موعده النهائي (30 يومًا).`, `${fmtNumber(lateCount)} request(s) passed the 30-day deadline.`)}</Notice>}
      <Section flush icon="list" title={tr('الطلبات', 'Requests')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالمرجع أو اسم المستخدم', 'Search by reference or user')} />
          <FilterSelect label={tr('النوع', 'Type')} value={list.filters.type} onChange={(v) => list.setFilter('type', v)} options={[{ value: '', label: tr('كل الأنواع', 'Any type') }, ...Object.entries(DATA_REQUEST_TYPE).map(([value, text]) => ({ value, label: tx(text) }))]} />
        </FilterBar>
        <DataTable
          caption={tr('طلبات البيانات', 'Data requests')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
          empty={<EmptyState icon="fingerprint" title={tr('لا توجد طلبات', 'No requests')} description={tr('تظهر هنا طلبات التصدير والحذف.', 'Export and deletion requests show up here.')} />}
          columns={[
            { key: 'ref', header: tr('المرجع', 'Reference'), render: (r) => <span className="ad-code">{r.reference}</span> },
            { key: 'user', header: tr('المستخدم', 'User'), render: (r) => <Person name={r.user.name} /> },
            { key: 'type', header: tr('النوع', 'Type'), render: (r) => label(DATA_REQUEST_TYPE, r.type) },
            { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <span className="ad-row"><Status map={DATA_REQUEST_STATUS} value={r.status} />{overdue(r) && <span className="ud-pill-status is-danger"><i />{tr('متأخر', 'Overdue')}</span>}</span> },
            { key: 'requested', header: tr('طُلب في', 'Requested'), render: (r) => <When value={r.requestedAt} /> },
            { key: 'due', header: tr('الموعد النهائي', 'Due'), render: (r) => <When value={r.dueAt} /> },
            { key: 'go', header: '', align: 'end', className: 'is-actions', render: (r) => <Button size="sm" variant="secondary" onClick={() => setOpen(r)}>{tr('تفاصيل', 'Details')}</Button> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} icon="fingerprint" title={open ? label(DATA_REQUEST_TYPE, open.type) : ''} description={open?.reference} size="md" footer={<Button variant="secondary" onClick={() => setOpen(null)}>{tr('إغلاق', 'Close')}</Button>}>
        {open && (
          <div className="ad-dialogform">
            <KV columns={2} items={[
              [tr('المستخدم', 'User'), can(P.USERS_VIEW) ? <Link className="ad-link" to={withParams(PATHS.ADMIN_USER_DETAIL, { userId: open.userId })} onClick={() => setOpen(null)}>{open.user.name}</Link> : open.user.name],
              [tr('الحالة', 'Status'), <Status map={DATA_REQUEST_STATUS} value={open.status} />],
              [tr('النطاق', 'Scope'), open.scope === 'account_and_cases' ? tr('الحساب والحالات', 'Account and cases') : tr('الحساب', 'Account')],
              [tr('طُلب في', 'Requested'), <When value={open.requestedAt} time />], [tr('الموعد النهائي', 'Due'), <When value={open.dueAt} />], [tr('اكتمل في', 'Completed'), <When value={open.completedAt} />],
              open.reasonCode && [tr('السبب', 'Reason'), label(DATA_REQUEST_REASON, open.reasonCode), { wide: true }],
            ]} />
            {open.status === 'deferred' && <Notice tone="warning">{tr('أُجّل الطلب لوجود التزام قائم. يُعاد النظر فيه عند انتهائه.', 'The request was deferred because of an active obligation. It is re-examined when that ends.')}</Notice>}
          </div>
        )}
      </Dialog>
    </div>
  );
}

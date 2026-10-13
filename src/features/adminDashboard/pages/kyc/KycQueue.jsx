import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { kycService } from '../../../../services/kyc/kycService';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { normalizeAdminKycListResponse } from '../../data/adminKycData';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, Pager, Person, SearchBox, Section, Status, Tabs, When, useLabel, usePagedList } from '../../ui/kit';
import { DOMAINS, kycStatus } from '../../ui/statuses';

const STATUS_TABS = ['', 'submitted', 'under_review', 'needs_information', 'verified', 'rejected'];

const fetchApplications = async (query) => {
  const { applications, pagination } = normalizeAdminKycListResponse(await kycService.getAdminKycApplications(query));
  return { items: applications, meta: pagination };
};

/** Queue of expert verification (KYC) applications — GET /api/admin/kyc/applications. */
export default function KycQueue() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const label = useLabel();
  const { queues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const list = usePagedList(fetchApplications, { status: params.get('status') || '', search: '' });
  const status = list.filters.status;
  const changeStatus = (value) => { list.setFilter('status', value); setParams(value ? { status: value } : {}, { replace: true }); };
  const tabLabel = (value) => (value ? tx(kycStatus(value).label) : tr('الكل', 'All'));
  const tabCount = { submitted: queues.kycSubmitted, under_review: queues.kycReview };

  return (
    <div className="ad-page">
      <PageHeader icon="shieldCheck" title={tr('التحقق من الخبراء', 'Expert verification')} subtitle={tr('راجع طلبات التحقق من الهوية والمؤهلات، وحدّد النطاقات المهنية التي يُعتمد الخبير فيها.', 'Review identity and qualification applications and decide which professional scopes an expert is approved for.')} />
      <Tabs label={tr('حالة الطلب', 'Application status')} value={status} onChange={changeStatus} tabs={STATUS_TABS.map((value) => ({ id: value, label: tabLabel(value), count: tabCount[value] > 0 ? fmtNumber(tabCount[value]) : null }))} />
      <Section flush icon="list" title={tr('الطلبات', 'Applications')}>
        <FilterBar>
          <SearchBox value={list.filters.search} onChange={(value) => list.setFilter('search', value)} placeholder={tr('ابحث بالاسم أو المرجع أو البريد', 'Search by name, reference or email')} />
        </FilterBar>
        <DataTable
          caption={tr('طلبات التحقق', 'Verification applications')}
          rows={list.items}
          loading={list.loading}
          error={list.error}
          onRetry={() => list.reload()}
          to={(row) => withParams(PATHS.ADMIN_KYC_REVIEW, { kycId: row.id })}
          empty={<EmptyState icon="shieldCheck" title={tr('لا توجد طلبات في هذه القائمة', 'No applications in this list')} description={tr('عندما يرسل خبير طلب تحقق جديدًا سيظهر هنا.', 'A new verification request from an expert will show up here.')} />}
          columns={[
            { key: 'name', header: tr('الخبير', 'Expert'), render: (row) => <Person name={row.name} sub={row.reference} /> },
            { key: 'domain', header: tr('المجال والاختصاص', 'Domain & jurisdiction'), render: (row) => <span><b>{label(DOMAINS, row.application.domain)}</b><br /><small className="ad-muted" dir="auto">{row.jurisdiction}</small></span> },
            { key: 'status', header: tr('الحالة', 'Status'), render: (row) => <Status meta={kycStatus(row.statusCode)} /> },
            { key: 'docs', header: tr('المستندات', 'Documents'), align: 'center', render: (row) => fmtNumber(row.documentsCount) },
            { key: 'submitted', header: tr('تاريخ الإرسال', 'Submitted'), render: (row) => <When value={row.submittedAt} /> },
            { key: 'go', header: '', align: 'end', className: 'is-actions', render: (row) => <Button to={withParams(PATHS.ADMIN_KYC_REVIEW, { kycId: row.id })} variant={row.statusCode === 'submitted' ? 'primary' : 'secondary'} size="sm">{row.statusCode === 'submitted' ? tr('بدء المراجعة', 'Start review') : tr('فتح', 'Open')}</Button> },
          ]}
        />
        <Pager meta={list.meta} onPage={list.setPage} />
      </Section>
    </div>
  );
}

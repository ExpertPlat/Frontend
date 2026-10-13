import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PATHS, withParams } from '../../../../routes/paths';
import { adminFinance } from '../../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../../adminAuthorization/adminPermissions';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Button, EmptyState, PageHeader } from '../../../userDashboard/components/ui';
import { useAdminSession } from '../../session/AdminSessionContext';
import { DataTable, FilterBar, FilterSelect, Money, Notice, Pager, Person, SearchBox, Section, Status, Tabs, When, useAdminAction, useLabel, usePagedList } from '../../ui/kit';
import { ATTEMPT_STATUS, DISPUTE_REASON, DISPUTE_STATUS, FUNDING_STATUS, LEDGER_TYPE, RECON_KIND, RECON_STATUS, REFUND_KIND, REFUND_REASON, REFUND_STATUS, STRIPE_ACCOUNT_STATUS } from '../../ui/statuses';
import { RefundDecisionDialog } from './refundDialogs';

const fundingLink = (id) => withParams(PATHS.ADMIN_FUNDING_DETAIL, { fundingId: id });

function PaymentsTab() {
  const { tr, tx } = useUserI18n();
  const list = usePagedList((q) => adminFinance.fundings(q), { search: '', status: '' });
  return (
    <Section flush icon="card" title={tr('الدفعات', 'Payments')}>
      <FilterBar>
        <SearchBox value={list.filters.search} onChange={(v) => list.setFilter('search', v)} placeholder={tr('ابحث بالحالة أو الأسماء', 'Search by case or names')} />
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('كل الحالات', 'Any status') }, ...['funded', 'requires_payment', 'partially_refunded', 'refunded', 'failed', 'expired'].map((v) => ({ value: v, label: tx(FUNDING_STATUS[v].label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('الدفعات', 'Payments')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()} to={(r) => fundingLink(r.id)}
        empty={<EmptyState icon="card" title={tr('لا توجد دفعات', 'No payments')} />}
        columns={[
          { key: 'case', header: tr('الدفعة', 'Payment'), primary: true, render: (r) => <span><b dir="auto">{r.caseTitle}</b><br /><small className="ad-muted">#{r.id}</small></span> },
          { key: 'user', header: tr('المستخدم', 'User'), render: (r) => r.user?.name },
          { key: 'expert', header: tr('الخبير', 'Expert'), render: (r) => r.expert?.name },
          { key: 'gross', header: tr('المبلغ', 'Amount'), render: (r) => <Money minor={r.amounts.grossMinor} currency={r.amounts.currency} strong /> },
          { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={FUNDING_STATUS} value={r.status} /> },
          { key: 'flags', header: tr('تنبيهات', 'Flags'), render: (r) => <span className="ad-row">{r.pendingRefunds > 0 && <span className="ud-pill-status is-warning"><i />{tr('استرداد معلّق', 'Refund pending')}</span>}{r.openReconciliation > 0 && <span className="ud-pill-status is-amber"><i />{tr('فرق مطابقة', 'Mismatch')}</span>}</span> },
          { key: 'created', header: tr('التاريخ', 'Date'), render: (r) => <When value={r.createdAt} /> },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

function RefundsTab() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can, refreshQueues } = useAdminSession();
  const list = usePagedList((q) => adminFinance.refunds(q), { status: 'pending_review' });
  const [deciding, setDeciding] = useState(null);
  const done = () => { setDeciding(null); list.reload({ silent: true }); refreshQueues(); };
  return (
    <Section flush icon="banknote" title={tr('طلبات الاسترداد', 'Refund requests')}>
      <FilterBar>
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('كل الحالات', 'Any status') }, ...Object.entries(REFUND_STATUS).map(([value, m]) => ({ value, label: tx(m.label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('طلبات الاسترداد', 'Refund requests')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="banknote" title={tr('لا طلبات استرداد', 'No refund requests')} description={tr('تظهر هنا طلبات المستخدمين وعمليات الاسترداد التي أنشأتها الإدارة.', 'User requests and admin-issued refunds show up here.')} />}
        columns={[
          { key: 'case', header: tr('الدفعة', 'Payment'), primary: true, render: (r) => <Link to={fundingLink(r.fundingId)}><b dir="auto">{r.funding?.caseTitle}</b><br /><small className="ad-muted">#{r.fundingId} · {label(REFUND_KIND, r.kind)}</small></Link> },
          { key: 'user', header: tr('المستخدم', 'User'), render: (r) => r.user?.name },
          { key: 'reason', header: tr('السبب', 'Reason'), render: (r) => label(REFUND_REASON, r.reasonCode) },
          { key: 'amount', header: tr('المبلغ', 'Amount'), render: (r) => <Money minor={r.approvedAmountMinor ?? r.requestedAmountMinor} currency={r.currency} strong /> },
          { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={REFUND_STATUS} value={r.status} /> },
          { key: 'date', header: tr('التاريخ', 'Date'), render: (r) => <When value={r.createdAt} /> },
          { key: 'go', header: '', align: 'end', className: 'is-actions', render: (r) => (r.status === 'pending_review' && can(P.REFUNDS_APPROVE) ? <Button size="sm" onClick={() => setDeciding(r)}>{tr('اتخاذ قرار', 'Decide')}</Button> : null) },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
      {deciding && <RefundDecisionDialog refund={deciding} onClose={() => setDeciding(null)} onDone={done} />}
    </Section>
  );
}

function LedgerTab() {
  const { tr, tx } = useUserI18n();
  const list = usePagedList((q) => adminFinance.ledger(q), { type: '' }, { perPage: 15 });
  return (
    <Section flush icon="book" title={tr('دفتر الحركات', 'Ledger')}>
      <FilterBar>
        <FilterSelect label={tr('النوع', 'Type')} value={list.filters.type} onChange={(v) => list.setFilter('type', v)} options={[{ value: '', label: tr('كل الأنواع', 'Any type') }, ...Object.entries(LEDGER_TYPE).map(([value, m]) => ({ value, label: tx(m.label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('دفتر الحركات', 'Ledger')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="book" title={tr('لا حركات', 'No entries')} />}
        columns={[
          { key: 'date', header: tr('التاريخ', 'Date'), render: (r) => <When value={r.createdAt} time /> },
          { key: 'type', header: tr('النوع', 'Type'), render: (r) => <Status map={LEDGER_TYPE} value={r.type} /> },
          { key: 'funding', header: tr('الدفعة', 'Payment'), render: (r) => <Link className="ad-link" to={fundingLink(r.fundingId)}>#{r.fundingId}</Link> },
          { key: 'memo', header: tr('البيان', 'Memo'), render: (r) => <span dir="auto">{r.memo}{r.duplicate ? ` · ${tr('مكرر', 'duplicate')}` : ''}</span> },
          { key: 'amount', header: tr('المبلغ', 'Amount'), align: 'end', render: (r) => <Money minor={r.direction === 'debit' ? -r.amountMinor : r.amountMinor} currency={r.currency} strong tone={r.direction === 'debit' ? 'danger' : undefined} /> },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

function ReconciliationTab() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const { can, refreshQueues } = useAdminSession();
  const list = usePagedList((q) => adminFinance.reconciliation(q), { status: 'open' });
  const action = useAdminAction(list.reload);
  const reconcile = async (row) => {
    const res = await action.run(() => adminFinance.reconcile(row.fundingId), { success: tr('تمت التسوية.', 'Reconciled.') });
    if (res.ok) { list.reload({ silent: true }); refreshQueues(); }
  };
  return (
    <Section flush icon="arrowUpDown" title={tr('مطابقة المدفوعات', 'Reconciliation')}>
      <div className="ad-pad" style={{ paddingBottom: 0 }}><Notice tone="info">{tr('فروقات بين ما سجّلته المنصة وما أبلغ عنه Stripe. التسوية تُغلق الفرق بعد أن تتأكد من الدفعة.', 'Differences between what the platform recorded and what Stripe reported. Reconciling closes the difference once you have checked the payment.')}</Notice></div>
      <FilterBar>
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('الكل', 'All') }, ...Object.entries(RECON_STATUS).map(([value, m]) => ({ value, label: tx(m.label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('المطابقة', 'Reconciliation')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="checkCircle" title={tr('لا فروقات', 'No differences')} description={tr('كل الدفعات مطابقة.', 'Everything matches.')} />}
        columns={[
          { key: 'kind', header: tr('النوع', 'Type'), primary: true, render: (r) => label(RECON_KIND, r.kind) },
          { key: 'funding', header: tr('الدفعة', 'Payment'), render: (r) => <Link className="ad-link" to={fundingLink(r.fundingId)}>#{r.fundingId}</Link> },
          { key: 'detail', header: tr('التفاصيل', 'Details'), render: (r) => <span dir="auto">{r.detail}</span> },
          { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={RECON_STATUS} value={r.status} /> },
          { key: 'at', header: tr('اكتُشف', 'Detected'), render: (r) => <When value={r.detectedAt} /> },
          { key: 'go', header: '', align: 'end', className: 'is-actions', render: (r) => (r.status === 'open' && can(P.FINANCE_RECONCILE) ? <Button size="sm" variant="secondary" icon="check" loading={action.busy} onClick={() => reconcile(r)}>{tr('تسوية', 'Reconcile')}</Button> : null) },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

function DisputesTab() {
  const { tr, tx } = useUserI18n();
  const label = useLabel();
  const list = usePagedList((q) => adminFinance.disputes(q), { status: '' });
  return (
    <Section flush icon="gavel" title={tr('النزاعات (Chargebacks)', 'Disputes (chargebacks)')}>
      <FilterBar>
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('الكل', 'All') }, ...Object.entries(DISPUTE_STATUS).map(([value, m]) => ({ value, label: tx(m.label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('النزاعات', 'Disputes')} rows={list.items} loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="gavel" title={tr('لا نزاعات', 'No disputes')} />}
        columns={[
          { key: 'case', header: tr('الدفعة', 'Payment'), primary: true, render: (r) => <Link to={fundingLink(r.fundingId)}><b dir="auto">{r.caseTitle}</b><br /><small className="ad-code">{r.stripeDisputeId}</small></Link> },
          { key: 'reason', header: tr('السبب', 'Reason'), render: (r) => label(DISPUTE_REASON, r.reason) },
          { key: 'amount', header: tr('المبلغ', 'Amount'), render: (r) => <Money minor={r.amountMinor} currency={r.funding?.amounts.currency} strong /> },
          { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={DISPUTE_STATUS} value={r.status} /> },
          { key: 'due', header: tr('آخر موعد للرد', 'Respond by'), render: (r) => (r.status === 'needs_response' ? <When value={r.dueBy} /> : <span className="ad-muted">—</span>) },
          { key: 'created', header: tr('فُتح', 'Opened'), render: (r) => <When value={r.createdAt} /> },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

function StripeTab() {
  const { tr, tx } = useUserI18n();
  const { can } = useAdminSession();
  const list = usePagedList((q) => adminFinance.stripeAccounts(q), { status: '' });
  return (
    <Section flush icon="wallet" title={tr('حسابات الخبراء في Stripe', 'Expert Stripe accounts')}>
      <FilterBar>
        <FilterSelect label={tr('الحالة', 'Status')} value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: '', label: tr('الكل', 'All') }, ...['enabled', 'restricted', 'disabled', 'onboarding_started'].map((value) => ({ value, label: tx(STRIPE_ACCOUNT_STATUS[value].label) }))]} />
      </FilterBar>
      <DataTable
        caption={tr('حسابات Stripe', 'Stripe accounts')} rows={list.items} rowKey="expertId" loading={list.loading} error={list.error} onRetry={() => list.reload()}
        empty={<EmptyState icon="wallet" title={tr('لا حسابات', 'No accounts')} />}
        columns={[
          { key: 'expert', header: tr('الخبير', 'Expert'), render: (r) => (can(P.EXPERTS_VIEW) ? <Person name={r.expert.name} to={withParams(PATHS.ADMIN_EXPERT_DETAIL, { expertId: r.expertId })} icon="briefcase" /> : <Person name={r.expert.name} icon="briefcase" />) },
          { key: 'acct', header: tr('الحساب', 'Account'), render: (r) => <span className="ad-code">{r.accountId}</span> },
          { key: 'status', header: tr('الحالة', 'Status'), render: (r) => <Status map={STRIPE_ACCOUNT_STATUS} value={r.status} /> },
          { key: 'charges', header: tr('استلام الدفع', 'Charges'), align: 'center', render: (r) => (r.chargesEnabled ? tr('نعم', 'Yes') : tr('لا', 'No')) },
          { key: 'payouts', header: tr('التحويلات', 'Payouts'), align: 'center', render: (r) => (r.payoutsEnabled ? tr('نعم', 'Yes') : tr('لا', 'No')) },
          { key: 'due', header: tr('مطلوب لإكمال الحساب', 'Requirements due'), render: (r) => (r.requirementsDue?.length ? <span className="ad-policy">{r.requirementsDue.map((x) => <span key={x} dir="ltr">{x}</span>)}</span> : <span className="ad-muted">—</span>) },
          { key: 'upd', header: tr('آخر تحديث', 'Updated'), render: (r) => <When value={r.updatedAt} /> },
        ]}
      />
      <Pager meta={list.meta} onPage={list.setPage} />
    </Section>
  );
}

const TAB_DEFS = [
  { id: 'payments', icon: 'card', label: ['الدفعات', 'Payments'], perm: P.FINANCE_VIEW, Comp: PaymentsTab },
  { id: 'refunds', icon: 'banknote', label: ['الاسترداد', 'Refunds'], perm: P.REFUNDS_VIEW, Comp: RefundsTab, queue: 'refunds' },
  { id: 'reconciliation', icon: 'arrowUpDown', label: ['المطابقة', 'Reconciliation'], perm: P.FINANCE_VIEW, Comp: ReconciliationTab, queue: 'reconciliation' },
  { id: 'disputes', icon: 'gavel', label: ['النزاعات', 'Disputes'], perm: P.DISPUTES_VIEW, Comp: DisputesTab, queue: 'disputes' },
  { id: 'ledger', icon: 'book', label: ['الدفتر', 'Ledger'], perm: P.FINANCE_VIEW, Comp: LedgerTab },
  { id: 'stripe', icon: 'wallet', label: ['حسابات Stripe', 'Stripe accounts'], perm: P.STRIPE_ACCOUNTS_VIEW, Comp: StripeTab },
];

export default function Finance() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const { can, queues } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const tabs = TAB_DEFS.filter((t) => can(t.perm));
  const wanted = params.get('tab');
  const tab = tabs.find((t) => t.id === wanted) || tabs[0];
  const Active = tab?.Comp;
  return (
    <div className="ad-page">
      <PageHeader icon="banknote" title={tr('المالية', 'Finance')} subtitle={tr('الأموال المحفوظة لدى المنصة، طلبات الاسترداد، فروقات المطابقة، النزاعات وحسابات الخبراء.', 'Funds held by the platform, refund requests, reconciliation issues, disputes and expert accounts.')} />
      {tab && <Tabs label={tr('أقسام المالية', 'Finance sections')} value={tab.id} onChange={(id) => setParams(id === tabs[0].id ? {} : { tab: id }, { replace: true })} tabs={tabs.map((t) => ({ id: t.id, icon: t.icon, label: tx(t.label), count: t.queue && queues[t.queue] > 0 ? fmtNumber(queues[t.queue]) : null }))} />}
      {Active && <Active key={tab.id} />}
    </div>
  );
}

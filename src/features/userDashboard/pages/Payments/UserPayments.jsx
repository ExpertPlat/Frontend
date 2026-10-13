import React from 'react';
import { useResource } from '../../../../services/hooks';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import { Avatar, Button, Card, Chip, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../components/ui';
import { FUNDING_STATUS, pick } from '../../utils/statuses';
import { stagePath } from '../../journey/journeyData';
import { LoadError } from '../../journey/parts';

/** Funding of each agreement. Status is whatever the API says; there is no "mark as paid" action. */
export default function UserPayments() {
  const { tr, tx, fmtDateShort, fmtMoney } = useUserI18n();
  const workspace = useResource(() => workspaceService.load(), []);
  const d = workspace.data;
  const rows = [...(d?.fundings || [])].sort((a, b) => String(b.createdAt).localeCompare(a.createdAt));
  const held = rows.filter((f) => f.status === 'funded').reduce((sum, f) => sum + f.amounts.grossMinor, 0);
  const currency = rows[0]?.amounts.currency || 'AED';
  return (
    <div className="jr-page">
      <PageHeader icon="card" title={tr('المدفوعات', 'Payments')} subtitle={tr('المبالغ محفوظة لدى المنصة وتُحوَّل للخبير بعد إنجاز الجلسة.', 'Amounts are held by the platform and released to the expert after the session.')} />
      {workspace.error && <LoadError message={workspace.errorMessage} onRetry={() => workspace.reload()} />}
      {workspace.loading && !d && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {d && rows.length === 0 && <Card className="jr-card"><EmptyState icon="card" title={tr('لا توجد مدفوعات بعد', 'No payments yet')} description={tr('تظهر هنا بعد قبول عرض وتمويل الاتفاق.', 'They appear here after you accept an offer and fund the agreement.')} /></Card>}
      {d && rows.length > 0 && (
        <>
          <Card className="jr-card jr-total"><small>{tr('إجمالي ما موّلته', 'Total you funded')}</small><b>{fmtMoney(held, currency)}</b></Card>
          <Card className="jr-card">
            <ul className="jr-rows jr-rows--people">
              {rows.map((f) => {
                const status = pick(FUNDING_STATUS, f.status);
                return (
                  <li key={f.id}><Avatar src={f.expert.avatarUrl} name={f.expert.name} size={44} /><span className="jr-rows__copy"><b>{f.expert.name}</b><small>{f.caseTitle} · {fmtDateShort(f.createdAt)}</small>{f.receiptAvailable && <Chip icon="receipt">{tr('الإيصال متاح', 'Receipt available')}</Chip>}</span><span className="jr-rows__side"><b>{fmtMoney(f.amounts.grossMinor, f.amounts.currency)}</b><StatusPill tone={status.tone}>{tx(status.label)}</StatusPill></span><Button size="sm" variant="secondary" to={stagePath(f.caseId, 'agreement')}>{tr('فتح', 'Open')}</Button></li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

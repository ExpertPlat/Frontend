import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { expertOfferingsService } from '../../../../services/expert/expertWorkService';
import { Button, Card, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { ResourceError } from '../../common/parts';
import { LANGUAGE_LABEL, SERVICE_MODE_LABEL } from '../../utils/expertStatuses';

export const OFFERING_STATUS = { draft: ['neutral', ['مسودة', 'Draft']], published: ['success', ['منشورة', 'Published']], paused: ['warning', ['متوقفة', 'Paused']] };
export const editPath = (id) => PATHS.EXPERT_OFFERING_DETAIL.replace(':offeringId', id);

/** The services the expert offers. Each offering points at one catalog service. */
export default function ExpertOfferings() {
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const list = useResource(() => expertOfferingsService.list(), []);
  const [busy, setBusy] = useState(null);
  const toggle = async (offering) => {
    setBusy(offering.id);
    try { await (offering.status === 'published' ? expertOfferingsService.pause(offering) : expertOfferingsService.publish(offering)); await list.reload({ silent: true }); } catch (error) {
      if (error.status === 409) await list.reload({ silent: true });
      notify({ message: error?.payload?.message || tr('تعذر التحديث.', 'Could not update.'), tone: 'error' });
    } finally { setBusy(null); }
  };
  return (
    <div className="jr-page">
      <PageHeader icon="briefcase" title={tr('خدماتي', 'My services')} subtitle={tr('الخدمات التي يطلبها العملاء منك.', 'The services clients can ask you for.')} actions={<Button icon="plus" to={PATHS.EXPERT_OFFERING_NEW}>{tr('خدمة جديدة', 'New service')}</Button>} />
      <ResourceError resource={list} />
      {list.loading && !list.data && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {list.data && list.data.length === 0 && <Card className="jr-card"><EmptyState icon="briefcase" title={tr('لا توجد خدمات بعد', 'No services yet')} description={tr('أضف أول خدمة لتظهر في ترشيحات العملاء.', 'Add your first service so clients can be matched to you.')} action={<Button icon="plus" to={PATHS.EXPERT_OFFERING_NEW}>{tr('خدمة جديدة', 'New service')}</Button>} /></Card>}
      {list.data?.length > 0 && (
        <Card className="jr-card"><ul className="jr-rows">
          {list.data.map((o) => { const [tone, label] = OFFERING_STATUS[o.status] || OFFERING_STATUS.draft; return (
            <li key={o.id}><span className="jr-rows__copy"><b>{o.service ? o.service.label : `#${o.catalogEntryId}`}</b>
              <small>{o.deliveryModes.map((m) => tx(SERVICE_MODE_LABEL[m] || [m, m])).join(' · ')} · {o.languages.map((l) => tx(LANGUAGE_LABEL[l] || [l, l])).join('، ')}</small></span>
              <StatusPill tone={tone}>{tx(label)}</StatusPill>
              <Button size="sm" variant="ghost" icon="edit" to={editPath(o.id)}>{tr('تعديل', 'Edit')}</Button>
              <Button size="sm" variant="secondary" loading={busy === o.id} onClick={() => toggle(o)}>{o.status === 'published' ? tr('إيقاف', 'Pause') : tr('نشر', 'Publish')}</Button></li>
          ); })}
        </ul></Card>
      )}
    </div>
  );
}

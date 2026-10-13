import React from 'react';
import { useResource } from '../../../../services/hooks';
import { expertAccountService } from '../../../../services/expert/expertWorkService';
import { Card, EmptyState, PageHeader, SkeletonRows } from '../../../userDashboard/components/ui';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Stars } from '../../../userDashboard/journey/parts';
import { ResourceError } from '../../common/parts';
import { useExpertSession } from '../../session/ExpertSessionContext';

/** What clients say about the expert. This is the public list; there is no reply action in the API. */
export default function ExpertReviews() {
  const { tr, fmtDate, fmtNumber } = useUserI18n();
  const { me } = useExpertSession();
  const data = useResource(() => expertAccountService.publicReviews(me.slug), [me?.slug], { enabled: Boolean(me?.slug) });
  const d = data.data;
  const dist = d?.distribution || {};
  const total = Math.max(1, d?.count || 0);
  return (
    <div className="jr-page">
      <PageHeader icon="star" title={tr('التقييمات', 'Reviews')} subtitle={tr('ما يقوله العملاء عنك.', 'What clients say about you.')} />
      <ResourceError resource={data} />
      {(data.loading || !me) && !d && <Card className="jr-card"><SkeletonRows rows={3} /></Card>}
      {d && d.count === 0 && <Card className="jr-card"><EmptyState icon="star" title={tr('لا توجد تقييمات بعد', 'No reviews yet')} description={tr('تظهر تقييمات العملاء هنا بعد جلساتك.', 'Client reviews appear here after your sessions.')} /></Card>}
      {d && d.count > 0 && (
        <>
          <Card className="jr-card ex-rating">
            <div className="ex-rating__score"><b>{fmtNumber(d.rating)}</b><Stars value={d.rating} size={18} /><small>{tr(`${fmtNumber(d.count)} تقييم`, `${fmtNumber(d.count)} reviews`)}</small></div>
            <ul className="ex-rating__bars">{[5, 4, 3, 2, 1].map((n) => <li key={n}><span>{fmtNumber(n)}</span><i><u style={{ width: `${Math.round(((dist[n] || 0) / total) * 100)}%` }} /></i><small>{fmtNumber(dist[n] || 0)}</small></li>)}</ul>
          </Card>
          <Card className="jr-card"><ul className="jr-rows ex-reviews">
            {d.reviews.map((r) => <li key={r.id}><span className="jr-rows__copy"><b>{r.reviewerName}</b><Stars value={r.rating} /><p>{r.body}</p><small>{fmtDate(r.createdAt)}</small></span></li>)}
          </ul></Card>
        </>
      )}
    </div>
  );
}

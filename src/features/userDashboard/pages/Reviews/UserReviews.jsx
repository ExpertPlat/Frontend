import React, { useState } from 'react';
import { useBrandFeedback } from '../../../../components/BrandFeedback/BrandFeedback';
import { useIdempotentAction, useResource } from '../../../../services/hooks';
import { reviewsService } from '../../../../services/user/commerceService';
import { workspaceService } from '../../../../services/user/workspaceService';
import { useUserI18n } from '../../i18n/UserI18nContext';
import UdIcon from '../../components/UdIcon';
import { Avatar, Button, Card, Dialog, EmptyState, PageHeader, SkeletonRows, StatusPill } from '../../components/ui';
import { LoadError } from '../../journey/parts';

function StarInput({ value, onChange }) {
  const { tr } = useUserI18n();
  return (
    <div className="jr-starinput" role="radiogroup" aria-label={tr('التقييم', 'Rating')}>
      {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} className={n <= value ? 'is-on' : ''} onClick={() => onChange(n)} aria-label={`${n}/5`}><UdIcon name="star" size={28} /></button>)}
    </div>
  );
}

function ReviewDialog({ item, onClose, onDone }) {
  const { tr } = useUserI18n();
  const { notify } = useBrandFeedback();
  const { busy, run } = useIdempotentAction('review');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const send = async () => {
    const result = await run(({ idempotencyKey }) => reviewsService.submit(item.caseId, item.id, { rating, body: comment }, { idempotencyKey }));
    if (!result.ok) { notify({ message: result.message, tone: 'error' }); return; }
    notify({ message: tr('شكرًا لك. سيظهر تقييمك بعد المراجعة.', 'Thank you. Your review appears after moderation.'), tone: 'success' }); onDone();
  };
  return (
    <Dialog open onClose={busy ? () => {} : onClose} icon="star" tone="amber" title={tr('قيّم تجربتك مع ', 'Rate your session with ') + item.expert.name} description={tr('تقييمك يساعد غيرك على الاختيار. يُراجع قبل نشره.', 'Your review helps others choose. It is moderated before it is shown.')}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="send" loading={busy} onClick={send}>{tr('إرسال التقييم', 'Send review')}</Button></>}>
      <div className="jr-invite">
        <StarInput value={rating} onChange={setRating} />
        <label className="ud-field__label" htmlFor="jr-review">{tr('تعليقك (اختياري)', 'Your comment (optional)')}</label>
        <div className="ud-input ud-input--area"><textarea id="jr-review" rows={4} value={comment} onChange={(event) => setComment(event.target.value)} /></div>
      </div>
    </Dialog>
  );
}

/** Completed agreements and whether the backend lets the person review them. */
export default function UserReviews() {
  const { tr } = useUserI18n();
  const [writing, setWriting] = useState(null);
  const list = useResource(async () => {
    const { agreements, bookings } = await workspaceService.load();
    const candidates = agreements.filter((a) => a.status === 'completed' || bookings.some((b) => b.agreementId === a.id && b.status === 'completed'));
    return Promise.all(candidates.map(async (a) => ({ ...a, eligibility: await reviewsService.eligibility(a.caseId, a.id) })));
  }, []);
  const rows = list.data || [];
  return (
    <div className="jr-page">
      <PageHeader icon="star" title={tr('التقييمات', 'Reviews')} subtitle={tr('قيّم الخبراء بعد انتهاء جلساتك.', 'Rate experts once your sessions are done.')} />
      {list.error && <LoadError message={list.errorMessage} onRetry={() => list.reload()} />}
      {list.loading && !list.data && <Card className="jr-card"><SkeletonRows rows={2} /></Card>}
      {list.data && rows.length === 0 && <Card className="jr-card"><EmptyState icon="star" title={tr('لا توجد جلسات لتقييمها', 'No sessions to review yet')} description={tr('تظهر هنا بعد إنهاء جلسة مع خبير.', 'They appear here after you finish a session with an expert.')} /></Card>}
      {rows.length > 0 && (
        <Card className="jr-card">
          <ul className="jr-rows jr-rows--people">
            {rows.map((a) => (
              <li key={a.id}><Avatar src={a.expert.avatarUrl} name={a.expert.name} size={44} /><span className="jr-rows__copy"><b>{a.expert.name}</b><small>{a.caseTitle}</small></span>
                {a.eligibility.eligible
                  ? <Button size="sm" icon="star" onClick={() => setWriting(a)}>{tr('اكتب تقييمًا', 'Write a review')}</Button>
                  : <StatusPill tone={a.eligibility.reason === 'already_reviewed' ? 'success' : 'neutral'}>{a.eligibility.reason === 'already_reviewed' ? tr('تم التقييم', 'Reviewed') : tr('غير متاح بعد', 'Not available yet')}</StatusPill>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {writing && <ReviewDialog item={writing} onClose={() => setWriting(null)} onDone={() => { setWriting(null); list.reload({ silent: true }); }} />}
    </div>
  );
}

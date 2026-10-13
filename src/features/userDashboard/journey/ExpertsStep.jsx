import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useBrandFeedback } from '../../../components/BrandFeedback/BrandFeedback';
import { getErrorMessage } from '../../../api/errorHandler';
import { useIdempotentAction, useResource } from '../../../services/hooks';
import { casesService } from '../../../services/user/casesService';
import { invitationsService, matchingService } from '../../../services/user/matchingService';
import { reviewsService } from '../../../services/user/commerceService';
import { useUserI18n } from '../i18n/UserI18nContext';
import UdIcon from '../components/UdIcon';
import { Avatar, Button, Card, Checkbox, Chip, Dialog, PageHeader, Segmented, SkeletonRows, StatusPill } from '../components/ui';
import { SCAN_STATUS } from '../utils/statuses';
import DemoNextStep from '../../demo/DemoNextStep';
import DemoBadge from '../../demo/DemoBadge';
import { expertHandoffActions } from '../../demo/demoConfig';
import { stagePath } from './journeyData';
import { useJourney } from './JourneyContext';
import { LoadError, Stars, useMoney } from './parts';

function ReviewsDialog({ expert, onClose }) {
  const { tr, fmtNumber, fmtDateShort } = useUserI18n();
  const reviews = useResource(() => reviewsService.publicForExpert(expert.slug), [expert?.slug], { enabled: !!expert });
  const data = reviews.data;
  const total = (data?.distribution || []).reduce((sum, n) => sum + n, 0) || 1;
  return (
    <Dialog open={!!expert} onClose={onClose} size="lg" icon="star" tone="amber" title={tr('تقييمات ', 'Reviews of ') + (expert?.name || '')} description={tr('من عملاء أنهوا جلسات فعلية عبر المنصة.', 'From clients who completed real sessions on the platform.')} footer={<Button variant="secondary" onClick={onClose}>{tr('إغلاق', 'Close')}</Button>}>
      {reviews.loading && <SkeletonRows rows={3} />}
      {reviews.error && <LoadError message={reviews.errorMessage} onRetry={() => reviews.reload()} />}
      {data && (
        <>
          <div className="jr-rev">
            <div className="jr-rev__score"><b>{fmtNumber(data.rating)}</b><Stars value={data.rating} size={18} /><small>{tr(`${fmtNumber(data.count)} تقييمًا`, `${fmtNumber(data.count)} reviews`)}</small></div>
            <ul className="jr-rev__dist" aria-label={tr('توزيع التقييمات', 'Rating distribution')}>
              {data.distribution.map((count, index) => (
                <li key={index}><span>{fmtNumber(5 - index)}</span><UdIcon name="star" size={13} /><i><b style={{ inlineSize: `${(count / total) * 100}%` }} /></i><em>{fmtNumber(count)}</em></li>
              ))}
            </ul>
          </div>
          <ul className="jr-rev__list">
            {data.reviews.map((review) => (
              <li key={review.id}><header><b>{review.reviewerName}</b><Stars value={review.rating} /><time>{fmtDateShort(review.createdAt)}</time></header><p>{review.body}</p></li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}

function CompareDialog({ list, onClose, onInvite }) {
  const { tr, fmtNumber } = useUserI18n();
  const money = useMoney();
  const rows = [
    [tr('التخصص', 'Specialty'), (c) => c.expert.title],
    [tr('نسبة الملاءمة', 'Match'), (c) => `${fmtNumber(c.matchScore)}%`],
    [tr('التقييم', 'Rating'), (c) => `${fmtNumber(c.expert.rating)} (${fmtNumber(c.expert.reviewsCount)})`],
    [tr('الخبرة', 'Experience'), (c) => tr(`${fmtNumber(c.expert.yearsExperience)} سنة`, `${fmtNumber(c.expert.yearsExperience)} years`)],
    [tr('جلسات منجزة', 'Sessions done'), (c) => fmtNumber(c.expert.completedSessions)],
    [tr('اللغات', 'Languages'), (c) => c.expert.languages.join(' · ')],
    [tr('وقت الرد', 'Replies'), (c) => c.expert.responseTime],
    [tr('السعر التقريبي', 'Typical price'), (c) => money({ amountMinor: c.expert.priceFromMinor, currency: c.expert.currency })],
  ];
  return (
    <Dialog open={list.length > 1} onClose={onClose} size="lg" icon="layers" title={tr('مقارنة الخبراء', 'Compare experts')} description={tr('الفروق الأهم بينهم في نظرة واحدة.', 'The differences that matter, at a glance.')} footer={<Button variant="secondary" onClick={onClose}>{tr('إغلاق', 'Close')}</Button>}>
      <div className="jr-compare" style={{ '--cols': list.length }}>
        <div className="jr-compare__head" />
        {list.map((c) => (
          <div key={c.expertId} className="jr-compare__head"><Avatar src={c.expert.avatarUrl} name={c.expert.name} size={52} /><b>{c.expert.name}</b><Button size="sm" icon="send" onClick={() => onInvite(c)}>{tr('دعوة', 'Invite')}</Button></div>
        ))}
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <div className="jr-compare__label">{label}</div>
            {list.map((c) => <div key={c.expertId + label} className="jr-compare__cell">{value(c)}</div>)}
          </React.Fragment>
        ))}
      </div>
    </Dialog>
  );
}

const SHARED_LABEL = { summary: ['ملخص حالتك الذي وافقت عليه', 'The case summary you approved'], answers: ['إجاباتك على أسئلة الخبراء', 'Your answers to the expert questions'], scope: ['التخصص المطلوب فقط', 'Only the specialty requested'] };

function InviteDialog({ candidate, caseData, onClose, onSent }) {
  const caseId = caseData.id;
  const { tr, tx } = useUserI18n();
  const { notify } = useBrandFeedback();
  const { busy, run } = useIdempotentAction('invite');
  const [message, setMessage] = useState(tr('مرحبًا، أحتاج استشارتك في الجزء المتعلق بتخصصك. شاركت معك ملخص الحالة وإجاباتي، وأتطلع إلى عرضك.', 'Hello, I need your advice on the part related to your specialty. I shared the case summary and my answers, and look forward to your proposal.'));
  const [granted, setGranted] = useState([]);
  const preview = useResource(() => matchingService.previewBrief(caseData, candidate.scopeId, { documentIds: granted }), [caseId, candidate?.scopeId, granted.join(',')], { enabled: !!candidate });
  const docs = useResource(() => casesService.documents.list(caseId), [caseId], { enabled: !!candidate });
  const shareable = (docs.data || []).filter((doc) => doc.currentVersion.scanStatus === 'clean');
  const e = candidate?.expert;

  const send = async () => {
    const result = await run(async ({ idempotencyKey }) => {
      // The brief is approved exactly as previewed (its contentHash), then the invitation points at that brief.
      const brief = await matchingService.createBrief(caseData, candidate.scopeId, preview.data, { documentIds: granted }, { idempotencyKey: `${idempotencyKey}-brief` });
      return invitationsService.create(caseId, { matchingRunId: candidate.runId, candidateId: candidate.candidateId, briefId: brief.id, message }, { idempotencyKey });
    });
    if (!result.ok) { notify({ message: result.message, tone: 'error' }); return; }
    onSent(result.data);
  };

  return (
    <Dialog open={!!candidate} onClose={busy ? () => {} : onClose} icon="send" title={tr('أرسل دعوة إلى ', 'Invite ') + (e?.name || '')} description={tr('سيرد عليك بعرض يوضح السعر والنطاق، ولن تدفع شيئًا الآن.', 'He or she will reply with a proposal showing the price and scope. You pay nothing now.')}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{tr('إلغاء', 'Cancel')}</Button><Button icon="send" loading={busy} disabled={!message.trim() || preview.loading || !preview.data} onClick={send}>{tr('إرسال الدعوة', 'Send invitation')}</Button></>}>
      {e && (
        <div className="jr-invite">
          <div className="jr-who"><Avatar src={e.avatarUrl} name={e.name} size={48} /><span><b>{e.name}</b><small>{e.title}</small></span></div>
          <label className="ud-field__label" htmlFor="jr-invite-msg">{tr('رسالتك', 'Your message')}</label>
          <div className="ud-input ud-input--area"><textarea id="jr-invite-msg" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} /></div>
          <div className="jr-shared"><b><UdIcon name="lock" size={15} />{tr('ما الذي سيراه الخبير', 'What the expert will see')}</b>
            <ul>{(preview.data?.sharedWithExpert || ['summary', 'answers', 'scope']).map((key) => <li key={key}><UdIcon name="check" size={14} stroke={2.6} />{tx(SHARED_LABEL[key] || [key, key])}</li>)}</ul>
          </div>
          {shareable.length > 0 && (
            <div className="jr-grants">
              <b>{tr('هل تريد مشاركة مستندات؟ (اختياري)', 'Share any documents? (optional)')}</b>
              {shareable.map((doc) => <Checkbox key={doc.id} checked={granted.includes(doc.id)} onChange={(on) => setGranted((list) => (on ? [...list, doc.id] : list.filter((x) => x !== doc.id)))} label={doc.currentVersion.title} />)}
            </div>
          )}
          {preview.error && <LoadError message={preview.errorMessage} />}
        </div>
      )}
    </Dialog>
  );
}

/** Stage 3: ranked experts for the confirmed specialties. POST matching-runs, then POST invitations. */
export default function ExpertsStep() {
  const { tr, tx, fmtNumber } = useUserI18n();
  const money = useMoney();
  const navigate = useNavigate();
  const journey = useJourney();
  const { caseData, caseId, invitations } = journey;
  const [filter, setFilter] = useState('all');
  const [compare, setCompare] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [reviewsFor, setReviewsFor] = useState(null);
  const [inviting, setInviting] = useState(null);
  const included = useMemo(() => (caseData?.scopes || []).filter((item) => item.included), [caseData]);
  const ready = caseData?.status === 'ready_for_matching';
  const matches = useResource(() => matchingService.findExperts(caseData, included), [caseId, included.map((s) => s.id).join(',')], { enabled: ready && included.length > 0 });
  const invitedIds = useMemo(() => new Set(invitations.filter((i) => ['pending', 'accepted'].includes(i.status)).map((i) => i.expert.id)), [invitations]);

  if (caseData && !ready) return <Navigate to={stagePath(caseId, 'analysis')} replace />;

  const all = matches.data?.candidates || [];
  const list = all.filter((c) => filter === 'all' || c.scopeId === Number(filter));
  const toggleCompare = (id, on) => setCompare((current) => (on ? [...current.filter((x) => x !== id), id].slice(-3) : current.filter((x) => x !== id)));
  const comparedList = compare.map((id) => all.find((c) => c.expertId === id)).filter(Boolean);
  const sent = async () => { setInviting(null); setComparing(false); await journey.refresh(); navigate(stagePath(caseId, 'offer')); };

  return (
    <div className="jr-page">
      <PageHeader icon="users" title={tr('الخبراء المناسبون لحالتك', 'Experts who fit your case')} subtitle={tr('رتّبناهم حسب مدى ملاءمتهم لما كتبته. اقرأ السبب، وشاهد التقييمات، ثم ادعُ من تراه مناسبًا.', 'Ranked by how well they fit what you wrote. Read why, check the reviews, then invite the one you like.')} />
      {invitedIds.size > 0 && <div className="jr-banner is-info"><UdIcon name="info" size={20} /><span>{tr('أرسلت دعوات لهذه الحالة. تابع ردود الخبراء في صفحة العرض.', 'You already sent invitations for this case. Follow the replies on the proposal page.')}</span><Button size="sm" variant="secondary" to={stagePath(caseId, 'offer')}>{tr('متابعة العرض', 'Go to proposal')}</Button></div>}
      {invitedIds.size > 0 && (
        <DemoNextStep id={`invited-${caseId}`}
          title={{ ar: 'أين أذهب بعد إرسال الدعوة؟', en: 'Where to go after sending the invitation?' }}
          body={{ ar: 'الخبير يردّ على دعوتك من لوحته هو. سجّل دخولك كخبير (حساب تجريبي) لقبول الدعوة وإرسال عرض، ثم عد هنا لتراه في خطوة «العرض».', en: 'The expert answers your invitation from their own dashboard. Sign in as the expert (demo account) to accept it and send a proposal, then come back here to see it in the "Proposal" step.' }}
          actions={expertHandoffActions(invitations.filter((i) => i.status === 'pending').map((i) => i.expert))} />
      )}
      <div className="jr-filter">
        <Segmented label={tr('تصفية حسب التخصص', 'Filter by specialty')} value={filter} onChange={setFilter} options={[{ value: 'all', label: tr('الكل', 'All'), count: all.length }, ...included.map((n) => ({ value: String(n.id), label: n.label.split(':')[0].split('،')[0] }))]} />
        <p><UdIcon name="info" size={16} />{tr('ننصحك بالبدء بالخبير الأعلى ملاءمة، ويمكنك دعوة بقية التخصصات لاحقًا.', 'We suggest starting with the best match; you can invite the other specialties later.')}</p>
      </div>
      {matches.data?.stale && <div className="jr-banner is-warning"><UdIcon name="alert" size={20} /><span>{tr('هذه النتائج قديمة لأن حالتك تغيّرت.', 'These results are out of date because your case changed.')}</span><Button size="sm" variant="secondary" onClick={() => matches.reload()}>{tr('تحديث', 'Refresh')}</Button></div>}
      {matches.loading && <Card><SkeletonRows rows={3} height={120} /></Card>}
      {matches.error && <LoadError message={matches.errorMessage} onRetry={() => matches.reload()} />}
      {matches.data && list.length === 0 && <Card className="jr-card"><p className="jr-lead">{tr('لا يوجد خبراء متاحون لهذا التخصص حاليًا. عدّل وصف حالتك قليلًا أو أضف «استشارة عامة» من خطوة التحليل.', 'No experts are available for this specialty right now. Adjust your description a little or add a "general consultation" from the analysis step.')}</p></Card>}

      <ul className="jr-experts">
        {list.map((c, index) => {
          const e = c.expert;
          const invited = invitedIds.has(e.id);
          return (
            <li key={c.expertId}>
              <Card className={`jr-expert${invited ? ' is-chosen' : ''}`}>
                <div className="jr-expert__top">
                  <Avatar src={e.avatarUrl} name={e.name} size={68} />
                  <div className="jr-expert__id">
                    <h3>{e.name}<DemoBadge show={e.isDemo} compact />{index === 0 && filter === 'all' && <StatusPill tone="success" dot={false}>{tr('الأنسب', 'Best match')}</StatusPill>}{invited && <StatusPill tone="earth" dot={false}>{tr('تمت دعوته', 'Invited')}</StatusPill>}</h3>
                    <p>{e.title}</p>
                    <span className="jr-expert__meta"><Stars value={e.rating} /><b>{fmtNumber(e.rating)}</b><small>({fmtNumber(e.reviewsCount)})</small><i aria-hidden="true" /><UdIcon name="mapPin" size={14} />{e.location}</span>
                  </div>
                  <div className="jr-match" aria-label={tr('نسبة الملاءمة', 'Match score')}><b>{fmtNumber(c.matchScore)}<small>%</small></b><span>{tr('ملاءمة', 'match')}</span></div>
                </div>
                <div className="jr-why">
                  <b><UdIcon name="sparkle" size={16} />{tr('لماذا هو مناسب لك؟', 'Why is this expert right for you?')}</b>
                  <ul>{c.reasons.map((line, i) => <li key={i}><UdIcon name="check" size={14} stroke={2.6} />{line}</li>)}</ul>
                </div>
                <div className="jr-expert__chips">
                  <Chip icon="clock">{e.responseTime}</Chip>
                  <Chip icon="languages">{e.languages.join(' · ')}</Chip>
                  <Chip icon="briefcase">{tr(`${fmtNumber(e.yearsExperience)} سنة خبرة`, `${fmtNumber(e.yearsExperience)} yrs experience`)}</Chip>
                  <Chip icon="card">{tr('من ', 'From ')}{money({ amountMinor: e.priceFromMinor, currency: e.currency })}</Chip>
                </div>
                <div className="jr-expert__foot">
                  <Checkbox checked={compare.includes(c.expertId)} onChange={(on) => toggleCompare(c.expertId, on)} label={tr('قارن', 'Compare')} />
                  <span className="jr-expert__btns">
                    <Button variant="secondary" size="sm" icon="star" onClick={() => setReviewsFor(e)}>{tr('التقييمات', 'Reviews')}</Button>
                    {invited
                      ? <Button size="sm" icon="fileCheck" to={stagePath(caseId, 'offer')}>{tr('متابعة العرض', 'Go to proposal')}</Button>
                      : <Button size="sm" icon="send" onClick={() => setInviting(c)}>{tr('أرسل دعوة', 'Invite')}</Button>}
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {compare.length > 0 && (
        <div className="jr-comparebar" role="region" aria-label={tr('المقارنة', 'Comparison')}>
          <span>{tr(`${fmtNumber(compare.length)} خبراء محددون للمقارنة`, `${fmtNumber(compare.length)} experts selected`)}</span>
          <Button size="sm" variant="ghost" onClick={() => setCompare([])}>{tr('مسح', 'Clear')}</Button>
          <Button size="sm" icon="layers" disabled={compare.length < 2} onClick={() => setComparing(true)}>{tr('قارن الآن', 'Compare now')}</Button>
        </div>
      )}

      {reviewsFor && <ReviewsDialog key={reviewsFor.slug} expert={reviewsFor} onClose={() => setReviewsFor(null)} />}
      {comparing && <CompareDialog list={comparedList} onClose={() => setComparing(false)} onInvite={(c) => { setComparing(false); setInviting(c); }} />}
      {inviting && <InviteDialog key={inviting.expertId} candidate={inviting} caseData={caseData} onClose={() => setInviting(null)} onSent={sent} />}
    </div>
  );
}

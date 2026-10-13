import React from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useUserI18n } from '../i18n/UserI18nContext';
import { Button, Card, EmptyState, SkeletonRows } from '../components/ui';
import { PATHS } from '../../../routes/paths';
import JourneyBar from './JourneyBar';
import { JourneyProvider, useJourney } from './JourneyContext';
import { STAGES, stagePath } from './journeyData';

const stageIndex = (pathname) => Math.max(0, STAGES.findIndex((item) => pathname.endsWith(`/${item.id}`)));

function Frame() {
  const { tr } = useUserI18n();
  const { pathname } = useLocation();
  const journey = useJourney();
  if (journey.loading && !journey.caseData) return <div className="jr-frame"><Card><SkeletonRows rows={5} /></Card></div>;
  if (journey.error && !journey.caseData) {
    const missing = journey.error.status === 404;
    return (
      <div className="jr-frame">
        <EmptyState icon={missing ? 'search' : 'alert'} title={missing ? tr('لم نجد هذه الحالة', 'We could not find this case') : tr('تعذّر تحميل الحالة', 'Could not load the case')} description={journey.errorMessage}
          action={<><Button variant="secondary" to={PATHS.USER_CASES}>{tr('حالاتي', 'My cases')}</Button>{!missing && <Button onClick={() => journey.reload()}>{tr('إعادة المحاولة', 'Try again')}</Button>}</>} />
      </div>
    );
  }
  const step = stageIndex(pathname);
  return (
    <div className="jr-frame">
      <JourneyBar step={step} reached={journey.reached} caseId={journey.caseId} />
      <Outlet />
    </div>
  );
}

/** Route element for /app/cases/:caseId/*: shared case data + the journey bar around the stage pages. */
export default function JourneyLayout() {
  const { caseId } = useParams();
  return <JourneyProvider key={caseId} caseId={caseId}><Frame /></JourneyProvider>;
}

/** /app/cases/:caseId -> the furthest stage reached so far. */
export function JourneyIndex() {
  const journey = useJourney();
  if (journey.loading && !journey.caseData) return <div className="jr-frame"><Card><SkeletonRows rows={3} /></Card></div>;
  const stage = STAGES[Math.max(1, Math.min(journey.reached, STAGES.length - 1))].id;
  return <Navigate to={stagePath(journey.caseId, stage)} replace />;
}

/** Wrapper for the "new case" screen: same bar, nothing reached yet. */
export function NewCaseFrame({ children }) {
  return <div className="jr-frame"><JourneyBar step={0} reached={0} caseId={null} />{children}</div>;
}

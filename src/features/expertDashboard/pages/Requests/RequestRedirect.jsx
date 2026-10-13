import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PATHS } from '../../../../routes/paths';
import { useResource } from '../../../../services/hooks';
import { expertWorkspaceService } from '../../../../services/expert/expertWorkspaceService';
import { useUserI18n } from '../../../userDashboard/i18n/UserI18nContext';
import { Card, SkeletonRows } from '../../../userDashboard/components/ui';
import { ResourceError } from '../../common/parts';

/**
 * Older links and notifications point at a proposal, an agreement or a booking. All of them belong to one request,
 * so we resolve the invitation they hang from and open the request page.
 */
export default function RequestRedirect({ by }) {
  const params = useParams();
  const { tr } = useUserI18n();
  const ws = useResource(() => expertWorkspaceService.load(), []);
  if (ws.error) return <div className="jr-page"><ResourceError resource={ws} /></div>;
  if (!ws.data) return <div className="jr-page"><Card className="jr-card" aria-label={tr('جارٍ التحميل', 'Loading')}><SkeletonRows rows={2} /></Card></div>;
  const id = Number(params[`${by}Id`]);
  const row = ws.data.requests.find((r) => (by === 'proposal' ? r.proposal?.id === id : by === 'agreement' ? r.agreement?.id === id : r.booking?.id === id || ws.data.bookings.some((b) => b.id === id && b.agreementId === r.agreement?.id)));
  return <Navigate to={row ? PATHS.EXPERT_INVITATION_DETAIL.replace(':invitationId', row.invitation.id) : PATHS.EXPERT_INVITATIONS} replace />;
}

import React, { createContext, useContext, useMemo } from 'react';
import { useResource } from '../../../services/hooks';
import { casesService } from '../../../services/user/casesService';
import { invitationsService } from '../../../services/user/matchingService';
import { agreementsService, proposalsService } from '../../../services/user/commerceService';
import { reachedStage } from './journeyData';

const JourneyContext = createContext(null);

/** Loads everything the five stages share for one case, in one place, and re-fetches it after every transition. */
export function JourneyProvider({ caseId, children }) {
  const { data, loading, error, errorMessage, reload } = useResource(async () => {
    const [caseData, invitations, proposals, agreements] = await Promise.all([
      casesService.get(caseId), invitationsService.list(caseId), proposalsService.list(caseId), agreementsService.list(caseId),
    ]);
    return { caseData, invitations, proposals, agreements };
  }, [caseId]);

  const value = useMemo(() => {
    const snapshot = data || { caseData: null, invitations: [], proposals: [], agreements: [] };
    return { caseId, ...snapshot, loading, error, errorMessage, reached: reachedStage(snapshot), refresh: (options) => reload({ silent: true, ...options }), reload };
  }, [caseId, data, loading, error, errorMessage, reload]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('useJourney must be used inside JourneyProvider');
  return context;
}

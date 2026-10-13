import { casesService } from './casesService.js';
import { invitationsService } from './matchingService.js';
import { agreementsService, bookingsService, fundingService, proposalsService } from './commerceService.js';

/**
 * Aggregates what the lists and the home page need. The API is organised per case, so this fans out
 * (cases -> per-case invitations, proposals, agreements -> per-agreement bookings and funding). A backend
 * aggregate endpoint can replace it later without touching any page.
 */
export const workspaceService = Object.freeze({
  async load() {
    const cases = await casesService.list();
    const live = cases.filter((item) => item.status !== 'draft' && item.status !== 'cancelled');
    const perCase = await Promise.all(live.map(async (item) => {
      const [invitations, proposals, agreements] = await Promise.all([invitationsService.list(item.id), proposalsService.list(item.id), agreementsService.list(item.id)]);
      const extras = await Promise.all(agreements.map(async (agreement) => {
        const [bookings, funding] = await Promise.all([bookingsService.list(item.id, agreement.id), fundingService.get(item.id, agreement.id)]);
        return { agreement, bookings, funding };
      }));
      return { caseItem: item, invitations, proposals, agreements, extras };
    }));
    const flat = (pick) => perCase.flatMap((entry) => pick(entry).map((row) => ({ ...row, caseId: entry.caseItem.id, caseTitle: entry.caseItem.title })));
    return {
      cases,
      invitations: flat((e) => e.invitations),
      proposals: flat((e) => e.proposals),
      agreements: flat((e) => e.agreements),
      bookings: flat((e) => e.extras.flatMap((x) => x.bookings.map((b) => ({ ...b, expert: x.agreement.expert })))),
      fundings: flat((e) => e.extras.map((x) => x.funding && { ...x.funding, expert: x.agreement.expert, agreement: x.agreement }).filter(Boolean)),
    };
  },
});

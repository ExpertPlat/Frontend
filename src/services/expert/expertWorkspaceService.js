import { expertInvitationsService, expertProposalsService, expertAgreementsService, expertBookingsService } from './expertWorkService.js';

/**
 * One call for the Expert home and the "requests" list: invitations joined with their proposal, agreement and booking.
 * The API has no aggregate endpoint, so this fans out four list calls (invitations, proposals, agreements, bookings).
 * Join keys: proposal.invitationId, agreement.proposalId, booking.agreementId.
 */
export const expertWorkspaceService = Object.freeze({
  async load() {
    const [invitations, proposals, agreements, bookings] = await Promise.all([
      expertInvitationsService.list(), expertProposalsService.list(), expertAgreementsService.list(), expertBookingsService.list(),
    ]);
    const requests = invitations.map((invitation) => {
      const proposal = proposals.find((item) => item.invitationId === invitation.id) || null;
      const agreement = proposal ? agreements.find((item) => item.proposalId === proposal.id) || null : null;
      const booking = agreement ? bookings.find((item) => item.agreementId === agreement.id && item.status !== 'cancelled') || null : null;
      return { invitation, proposal, agreement, booking };
    });
    return { invitations, proposals, agreements, bookings, requests };
  },
});

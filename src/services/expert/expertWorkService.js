import { expertApi } from '../http.js';
import { newIdempotencyKey } from '../idempotency.js';
import { toApiInstant } from '../money.js';

const keyed = (options, prefix) => ({ idempotencyKey: options?.idempotencyKey || newIdempotencyKey(prefix) });

/**
 * Everything the Expert workspace needs for day-to-day work (API handoff sections 11-15).
 * State changes send `expectedVersion` (the `version` of the record the page last read); a 409 means it changed elsewhere.
 */
export const expertInvitationsService = Object.freeze({
  list: () => expertApi.get('/api/expert/invitations'),
  get: (id) => expertApi.get(`/api/expert/invitations/${id}`),
  accept: (invitation, options) => expertApi.post(`/api/expert/invitations/${invitation.id}/accept`, { expectedVersion: invitation.version }, keyed(options, 'accept')),
  /** payload: { reasonCode?, note? } */
  decline: (invitation, { reasonCode, note } = {}, options) => expertApi.post(`/api/expert/invitations/${invitation.id}/decline`,
    { expectedVersion: invitation.version, ...(reasonCode ? { reasonCode } : {}), ...(note ? { note } : {}) }, keyed(options, 'decline')),
});

/**
 * Proposal content (ProposalContent in the handoff): { scopeSummary, inputsRequired?, deliverables:[{title,description?}], exclusions:[string],
 * clarificationAllowance, reviewPeriodHours, consultationMinutes?, currency, milestones:[{title,description?,amountMinor}], validityDays? }.
 * The total is the sum of the milestone amounts; there is no separate total field.
 */
export const expertProposalsService = Object.freeze({
  list: () => expertApi.get('/api/expert/proposals'),
  get: (id) => expertApi.get(`/api/expert/proposals/${id}`),
  create: (invitationId, content, options) => expertApi.post(`/api/expert/invitations/${invitationId}/proposal`, content, keyed(options, 'proposal')),
  revise: (proposal, content, options) => expertApi.post(`/api/expert/proposals/${proposal.id}/versions`, { expectedVersion: proposal.version, ...content }, keyed(options, 'revise')),
  withdraw: (proposal, { reasonCode } = {}, options) => expertApi.post(`/api/expert/proposals/${proposal.id}/withdraw`,
    { expectedVersion: proposal.version, ...(reasonCode ? { reasonCode } : {}) }, keyed(options, 'withdraw')),
});

export const expertAgreementsService = Object.freeze({
  list: () => expertApi.get('/api/expert/agreements'),
  get: (id) => expertApi.get(`/api/expert/agreements/${id}`),
  funding: (id) => expertApi.get(`/api/expert/agreements/${id}/funding`),
  cancel: (agreement, reasonCode) => expertApi.post(`/api/expert/agreements/${agreement.id}/cancel`, { expectedVersion: agreement.version, reasonCode }),
});

export const expertBookingsService = Object.freeze({
  list: () => expertApi.get('/api/expert/bookings'),
  get: (id) => expertApi.get(`/api/expert/bookings/${id}`),
  cancel: (booking, reasonCode) => expertApi.post(`/api/expert/bookings/${booking.id}/cancel`, { expectedVersion: booking.version, reasonCode }),
  reschedule: (booking, startAt) => expertApi.post(`/api/expert/bookings/${booking.id}/reschedule`, { expectedVersion: booking.version, startAt: toApiInstant(startAt) }),
});

export const expertStripeService = Object.freeze({
  account: () => expertApi.get('/api/expert/stripe/account'),
  onboardingLink: (options) => expertApi.post('/api/expert/stripe/onboarding-link', {}, keyed(options, 'stripe')),
  onboardingReturn: () => expertApi.post('/api/expert/stripe/onboarding/return', {}),
  sync: () => expertApi.post('/api/expert/stripe/account/sync', {}),
});

/** Offerings reference a catalog service by `catalogEntryId`. payload: { catalogEntryId (create only), deliveryModes, languages, jurisdictionCodes?, summary? } */
const offeringBody = ({ deliveryModes, languages, jurisdictionCodes, summary }) => ({ deliveryModes, languages, jurisdictionCodes: jurisdictionCodes || [], summary: summary || null });
export const expertOfferingsService = Object.freeze({
  eligibleServices: () => expertApi.get('/api/expert/offerings/eligible-services'),
  list: () => expertApi.get('/api/expert/offerings'),
  get: (id) => expertApi.get(`/api/expert/offerings/${id}`),
  create: (payload, options) => expertApi.post('/api/expert/offerings', { catalogEntryId: payload.catalogEntryId, ...offeringBody(payload) }, keyed(options, 'offering')),
  update: (offering, payload) => expertApi.put(`/api/expert/offerings/${offering.id}`, { expectedVersion: offering.version, ...offeringBody(payload) }),
  publish: (offering) => expertApi.post(`/api/expert/offerings/${offering.id}/publish`, { expectedVersion: offering.version }),
  pause: (offering) => expertApi.post(`/api/expert/offerings/${offering.id}/pause`, { expectedVersion: offering.version }),
});

export const expertNotificationsService = Object.freeze({
  list: () => expertApi.get('/api/expert/notifications'),
  markRead: (id) => expertApi.post(`/api/expert/notifications/${encodeURIComponent(id)}/read`, {}),
});

export const expertAccountService = Object.freeze({
  me: () => expertApi.get('/api/expert'),
  publicReviews: (slug) => expertApi.get(`/api/experts/${encodeURIComponent(slug)}/reviews`),
});

export const expertRenewalsService = Object.freeze({
  scopes: () => expertApi.get('/api/expert/scope-renewals/scopes'),
  list: () => expertApi.get('/api/expert/scope-renewals'),
  get: (id) => expertApi.get(`/api/expert/scope-renewals/${id}`),
  /** Opens a draft renewal for a verified scope. */
  start: (scopeId, options) => expertApi.post(`/api/expert/scopes/${scopeId}/renewals`, {}, keyed(options, 'renewal')),
  /** `version` is the renewal version you last read (optimistic concurrency). */
  addEvidence: (id, { version, file, note }) => {
    const body = new FormData();
    body.append('version', String(version));
    body.append('file', file);
    if (note) body.append('note', note);
    return expertApi.post(`/api/expert/scope-renewals/${id}/evidence`, body, { timeoutMs: 60000 });
  },
  submit: (id, version) => expertApi.post(`/api/expert/scope-renewals/${id}/submit`, { version }),
  cancel: (id, version) => expertApi.post(`/api/expert/scope-renewals/${id}/cancel`, { version }),
});

export const expertPasswordService = Object.freeze({
  change: (payload) => expertApi.put('/api/expert/auth/password', payload),
});

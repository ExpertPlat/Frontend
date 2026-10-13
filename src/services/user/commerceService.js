import { userApi } from '../http.js';
import { newIdempotencyKey } from '../idempotency.js';
import { toApiInstant } from '../money.js';

const V2 = '/api/v2/user/cases';
const keyed = (options, prefix) => ({ idempotencyKey: options?.idempotencyKey || newIdempotencyKey(prefix) });
const dateOnly = (date) => date.toISOString().slice(0, 10);

/**
 * Proposals, agreements, bookings, funding and reviews (API handoff sections 13-15).
 * Money is integer minor units. Every state change names the `version` the page last read (`expectedVersion`);
 * a 409 means someone else changed the record, and the caller should reload before trying again.
 */
export const proposalsService = Object.freeze({
  list: (caseId) => userApi.get(`${V2}/${caseId}/proposals`),
  get: (caseId, proposalId) => userApi.get(`${V2}/${caseId}/proposals/${proposalId}`),
  /** payload: { categories: ['price'|'scope'|'time'], message } */
  requestChange: (caseId, proposal, payload, options) => userApi.post(`${V2}/${caseId}/proposals/${proposal.id}/change-requests`,
    { expectedVersion: proposal.version, versionNo: proposal.versionNo, categories: payload.categories, message: payload.message }, keyed(options, 'change')),
  /** Accepting creates the agreement, which then waits for funding. There is no "mark as paid" anywhere. */
  accept: (caseId, proposal, options) => userApi.post(`${V2}/${caseId}/proposals/${proposal.id}/accept`,
    { expectedVersion: proposal.version, versionNo: proposal.versionNo, totalAmountMinor: proposal.current.amount.amountMinor, currency: proposal.current.currency, acknowledge: true }, keyed(options, 'accept')),
  reject: (caseId, proposal, { reasonCode } = {}, options) => userApi.post(`${V2}/${caseId}/proposals/${proposal.id}/reject`,
    { expectedVersion: proposal.version, ...(reasonCode ? { reasonCode } : {}) }, keyed(options, 'reject')),
});

export const agreementsService = Object.freeze({
  list: (caseId) => userApi.get(`${V2}/${caseId}/agreements`),
  get: (caseId, agreementId) => userApi.get(`${V2}/${caseId}/agreements/${agreementId}`),
  cancel: (caseId, agreement, reasonCode) => userApi.post(`${V2}/${caseId}/agreements/${agreement.id}/cancel`, { expectedVersion: agreement.version, reasonCode }),
  /** Open slots between two dates (`YYYY-MM-DD`); defaults to the next two weeks. */
  availability: (caseId, agreementId, range) => {
    const from = range?.from || dateOnly(new Date());
    const to = range?.to || dateOnly(new Date(Date.now() + 13 * 86400000));
    return userApi.get(`${V2}/${caseId}/agreements/${agreementId}/availability`, { query: { from, to } });
  },
});

export const bookingsService = Object.freeze({
  list: (caseId, agreementId) => userApi.get(`${V2}/${caseId}/agreements/${agreementId}/bookings`),
  /** Holds the slot, then confirms it. Both calls use the same logical key so a retry never double-books. */
  async book(caseId, agreementId, startAt, options) {
    const key = options?.idempotencyKey || newIdempotencyKey('booking');
    const held = await userApi.post(`${V2}/${caseId}/agreements/${agreementId}/bookings`, { startAt: toApiInstant(startAt) }, { idempotencyKey: key });
    return userApi.post(`${V2}/${caseId}/bookings/${held.id}/confirm`, { expectedVersion: held.version }, { idempotencyKey: `${key}-confirm` });
  },
  cancel: (caseId, booking, reasonCode) => userApi.post(`${V2}/${caseId}/bookings/${booking.id}/cancel`, { expectedVersion: booking.version, reasonCode }),
  reschedule: (caseId, booking, startAt) => userApi.post(`${V2}/${caseId}/bookings/${booking.id}/reschedule`, { expectedVersion: booking.version, startAt: toApiInstant(startAt) }),
});

export const fundingService = Object.freeze({
  get: (caseId, agreementId) => userApi.get(`${V2}/${caseId}/agreements/${agreementId}/funding`),
  open: (caseId, agreementId, options) => userApi.post(`${V2}/${caseId}/agreements/${agreementId}/funding`, {}, keyed(options, 'funding')),
  /** Returns { checkoutUrl }: send the browser ONLY to this URL. The redirect back is not proof of payment; call sync(). */
  checkout: (caseId, fundingId, options) => userApi.post(`${V2}/${caseId}/fundings/${fundingId}/checkout`, {}, keyed(options, 'checkout')),
  sync: (caseId, fundingId) => userApi.post(`${V2}/${caseId}/fundings/${fundingId}/sync`, {}),
  documents: (caseId, fundingId) => userApi.get(`${V2}/${caseId}/fundings/${fundingId}/documents`),
});

export const reviewsService = Object.freeze({
  eligibility: (caseId, agreementId) => userApi.get(`${V2}/${caseId}/agreements/${agreementId}/review-eligibility`),
  /** payload: { rating: 1-5, body } */
  submit: (caseId, agreementId, { rating, body }, options) => userApi.post(`${V2}/${caseId}/agreements/${agreementId}/review`, { rating, body: body || null }, keyed(options, 'review')),
  publicForExpert: (slug) => userApi.get(`/api/experts/${encodeURIComponent(slug)}/reviews`),
});

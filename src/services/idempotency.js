/**
 * Idempotency-Key helper for retry-sensitive writes (invitations, proposal actions, funding, checkout, bookings).
 * One key identifies one logical request: reuse the same key when retrying it, create a new one for a new request.
 */
export function newIdempotencyKey(prefix = 'sv') {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${random}`;
}

/**
 * Reason codes sent with declines, withdrawals, rejections and cancellations.
 * The handoff names the fields (reasonCode) but not the enum values, so they live here, in one place:
 * confirm them with the backend (Invitations::DECLINE_REASONS, Proposals::REJECT_REASONS/WITHDRAW_REASONS, Agreements::CANCEL_REASONS).
 */
export const DECLINE_REASONS = [
  { id: 'unavailable', label: ['لا أملك وقتًا حاليًا', 'I do not have capacity right now'] },
  { id: 'out_of_scope', label: ['خارج تخصصي', 'Outside my expertise'] },
  { id: 'conflict', label: ['تعارض مصالح', 'Conflict of interest'] },
  { id: 'other', label: ['سبب آخر', 'Another reason'] },
];
export const WITHDRAW_REASONS = [
  { id: 'price_changed', label: ['تغيّر التسعير', 'My pricing changed'] },
  { id: 'unavailable', label: ['لم أعد متاحًا', 'I am no longer available'] },
  { id: 'other', label: ['سبب آخر', 'Another reason'] },
];
export const CANCEL_REASONS = [
  { id: 'schedule_conflict', label: ['تعارض في الموعد', 'Schedule conflict'] },
  { id: 'unavailable', label: ['لم أعد متاحًا', 'I am no longer available'] },
  { id: 'other', label: ['سبب آخر', 'Another reason'] },
];

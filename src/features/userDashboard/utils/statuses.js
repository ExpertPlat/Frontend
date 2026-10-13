/**
 * How server states are shown. Statuses come from the API; this file only maps them to a tone and a label.
 * Pages never infer a state: they render the one the API returned (and re-fetch after every transition).
 */
const S = (tone, ar, en) => ({ tone, label: [ar, en] });

export const CASE_STATUS = {
  draft: S('neutral', 'مسودة', 'Draft'),
  intake_in_progress: S('warning', 'قيد الإدخال', 'In progress'),
  needs_clarification: S('warning', 'تحتاج توضيحًا', 'Needs clarification'),
  needs_information: S('warning', 'تحتاج معلومات', 'Needs information'),
  ready_for_matching: S('success', 'جاهزة للخبراء', 'Ready for experts'),
  requires_review: S('earth', 'قيد مراجعة الفريق', 'Under team review'),
  waiting_for_expert_supply: S('amber', 'بانتظار توفر الخبراء', 'Waiting for experts'),
  unsupported_domain: S('danger', 'مجال غير مدعوم', 'Unsupported domain'),
  unsupported_jurisdiction: S('danger', 'دولة غير مدعومة', 'Unsupported country'),
  regulated_service_not_enabled: S('danger', 'خدمة غير مفعّلة', 'Service not enabled'),
  not_suitable_for_remote_service: S('danger', 'لا تناسب الخدمة عن بُعد', 'Not suitable remotely'),
  safety_referral_required: S('danger', 'تحويل لجهة مختصة', 'Safety referral'),
  cancelled: S('neutral', 'ملغاة', 'Cancelled'),
};

export const INVITATION_STATUS = {
  pending: S('earth', 'بانتظار الرد', 'Awaiting reply'),
  accepted: S('success', 'مقبولة', 'Accepted'),
  declined: S('danger', 'مرفوضة', 'Declined'),
  expired: S('neutral', 'منتهية', 'Expired'),
  revoked: S('neutral', 'ملغاة', 'Revoked'),
};

export const PROPOSAL_STATUS = {
  submitted: S('warning', 'بانتظار قرارك', 'Awaiting your decision'),
  change_requested: S('earth', 'بانتظار تعديل الخبير', 'Waiting for the expert'),
  accepted: S('success', 'مقبول', 'Accepted'),
  rejected: S('danger', 'مرفوض', 'Declined'),
  withdrawn: S('neutral', 'مسحوب', 'Withdrawn'),
  expired: S('neutral', 'منتهي', 'Expired'),
};

export const AGREEMENT_STATUS = {
  awaiting_payment: S('warning', 'بانتظار الدفع', 'Awaiting payment'),
  active: S('success', 'فعّال', 'Active'),
  completed: S('olive', 'مكتمل', 'Completed'),
  cancelled: S('neutral', 'ملغى', 'Cancelled'),
};

export const BOOKING_STATUS = {
  held: S('amber', 'حجز مؤقت', 'On hold'),
  confirmed: S('success', 'مؤكد', 'Confirmed'),
  cancelled: S('neutral', 'ملغي', 'Cancelled'),
  completed: S('neutral', 'منتهي', 'Completed'),
};

export const FUNDING_STATUS = {
  requires_payment: S('warning', 'بانتظار الدفع', 'Awaiting payment'),
  processing: S('amber', 'قيد التحقق', 'Verifying'),
  funded: S('success', 'ممول', 'Funded'),
  failed: S('danger', 'تعذّر الدفع', 'Payment failed'),
  expired: S('neutral', 'منتهي الصلاحية', 'Expired'),
  refund_requested: S('earth', 'طلب استرداد', 'Refund requested'),
  partially_refunded: S('earth', 'مسترد جزئيًا', 'Partially refunded'),
  refunded: S('neutral', 'مسترد', 'Refunded'),
};

export const SCAN_STATUS = {
  clean: S('success', 'آمن', 'Safe'),
  pending: S('amber', 'قيد الفحص', 'Scanning'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
  failed: S('danger', 'تعذّر الفحص', 'Scan failed'),
};

export const OFFERING_STATUS = {
  draft: S('neutral', 'مسودة', 'Draft'),
  published: S('success', 'منشورة', 'Published'),
  paused: S('amber', 'متوقفة', 'Paused'),
};

export const STRIPE_STATUS = {
  not_started: S('neutral', 'لم يبدأ', 'Not started'),
  onboarding_started: S('amber', 'قيد الإعداد', 'In progress'),
  enabled: S('success', 'مفعّل', 'Enabled'),
  restricted: S('danger', 'مقيّد', 'Restricted'),
};

export const REVIEW_STATUS = {
  pending_moderation: S('amber', 'قيد المراجعة', 'Under moderation'),
  published: S('success', 'منشور', 'Published'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
};

/** Looks a status up with a safe fallback so an unknown server value never breaks the page. */
export const pick = (table, key) => table[key] || S('neutral', String(key || '—'), String(key || '—'));

export const URGENCY = [
  { id: 'normal', label: ['عادية', 'Normal'] },
  { id: 'soon', label: ['قريبة', 'Soon'] },
  { id: 'urgent', label: ['عاجلة', 'Urgent'] },
];
export const CASE_LANGUAGES = [
  { id: 'ar', label: ['العربية', 'Arabic'], hint: ['اللهجة المصرية مقبولة', 'Dialects are fine'] },
  { id: 'en', label: ['الإنجليزية', 'English'] },
  { id: 'fr', label: ['الفرنسية', 'French'] },
  { id: 'tr', label: ['التركية', 'Turkish'] },
];
export const CHANGE_REASONS = [
  { id: 'price', label: ['السعر', 'Price'] },
  { id: 'scope', label: ['نطاق العمل', 'Scope'] },
  { id: 'time', label: ['المدة', 'Timing'] },
];
export const REJECT_REASONS = [
  { id: 'price', label: ['السعر أعلى من ميزانيتي', 'The price is above my budget'] },
  { id: 'scope', label: ['النطاق لا يغطي ما أحتاجه', 'The scope does not cover what I need'] },
  { id: 'other', label: ['اخترت خبيرًا آخر', 'I chose another expert'] },
];

import { getStatusMeta } from '../../kyc/data/kycStore';
import {
  AGREEMENT_STATUS, BOOKING_STATUS, CASE_STATUS, FUNDING_STATUS, INVITATION_STATUS, PROPOSAL_STATUS, SCAN_STATUS, STRIPE_STATUS as USER_STRIPE_STATUS, pick,
} from '../../userDashboard/utils/statuses';

/**
 * How admin-side server states are shown. The API owns every state and transition; this file only maps a value to a
 * tone and a bilingual label, with a safe fallback so an unknown value never breaks a page.
 */
const S = (tone, ar, en) => ({ tone, label: [ar, en] });

export { AGREEMENT_STATUS, BOOKING_STATUS, CASE_STATUS, FUNDING_STATUS, INVITATION_STATUS, PROPOSAL_STATUS, SCAN_STATUS, pick };

/** KYC statuses come from the shared KYC store (the same labels the expert sees). */
export const kycTone = (tone) => (tone === 'review' ? 'peach' : tone);
export const kycStatus = (status) => {
  const meta = getStatusMeta(status);
  return { tone: kycTone(meta.tone), label: [meta.ar, meta.en] };
};
/** Account-level kyc status on an expert row (approved / pending / rejected …). */
export const ACCOUNT_KYC = {
  approved: S('success', 'معتمد', 'Approved'),
  pending: S('warning', 'قيد المراجعة', 'Pending'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
  not_submitted: S('neutral', 'لم يُقدّم', 'Not submitted'),
  needs_information: S('warning', 'معلومات مطلوبة', 'Needs information'),
  under_review: S('peach', 'قيد المراجعة', 'Under review'),
  submitted: S('warning', 'مُقدّم', 'Submitted'),
  verified: S('success', 'تم التحقق', 'Verified'),
};

export const RENEWAL_STATUS = {
  submitted: S('warning', 'بانتظار المراجعة', 'Awaiting review'),
  under_review: S('peach', 'قيد المراجعة', 'Under review'),
  needs_information: S('amber', 'معلومات مطلوبة', 'Needs information'),
  approved: S('success', 'معتمد', 'Approved'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
  draft: S('neutral', 'مسودة', 'Draft'),
  cancelled: S('neutral', 'ملغى', 'Cancelled'),
};

export const SCOPE_STATUS = {
  active: S('success', 'فعّال', 'Active'),
  expired: S('danger', 'منتهي', 'Expired'),
  suspended: S('amber', 'موقوف', 'Suspended'),
  revoked: S('neutral', 'ملغى', 'Revoked'),
};

export const CATALOG_STATUS = {
  draft: S('neutral', 'مسودة', 'Draft'),
  reviewed: S('earth', 'تمت المراجعة', 'Reviewed'),
  intake_only: S('amber', 'استقبال فقط', 'Intake only'),
  pilot: S('olive', 'تجريبي', 'Pilot'),
  enabled: S('success', 'مفعّل', 'Enabled'),
  paused: S('amber', 'متوقف', 'Paused'),
  retired: S('neutral', 'متقاعد', 'Retired'),
  blocked: S('danger', 'محظور', 'Blocked'),
};
export const LIVE_STATUSES = ['intake_only', 'pilot', 'enabled'];
export const CLOSED_STATUSES = ['paused', 'retired', 'blocked'];

export const NODE_KIND = {
  country: ['الدول', 'Countries'],
  jurisdiction: ['الاختصاصات', 'Jurisdictions'],
  domain: ['المجالات', 'Domains'],
  specialty: ['التخصصات', 'Specialties'],
  service: ['الخدمات', 'Services'],
  delivery_mode: ['أنماط التقديم', 'Delivery modes'],
  safety_rule: ['قواعد السلامة', 'Safety rules'],
};

export const GRANT_STATUS = {
  active: S('success', 'فعّال', 'Active'),
  revoked: S('neutral', 'مسحوب', 'Revoked'),
};

export const MODERATION_STATUS = {
  pending_moderation: S('amber', 'بانتظار الإشراف', 'Awaiting moderation'),
  published: S('success', 'منشور', 'Published'),
  hidden: S('neutral', 'مخفي', 'Hidden'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
};
export const MODERATION_ACTION = {
  published: { icon: 'check', variant: 'primary', label: ['نشر', 'Publish'] },
  rejected: { icon: 'x', variant: 'danger', label: ['رفض', 'Reject'] },
  hidden: { icon: 'eyeOff', variant: 'secondary', label: ['إخفاء', 'Hide'] },
};

export const ADMIN_ACCOUNT_STATUS = {
  active: S('success', 'نشط', 'Active'),
  inactive: S('neutral', 'معطّل', 'Inactive'),
  pending_invitation: S('amber', 'بانتظار قبول الدعوة', 'Invitation pending'),
};

export const REFUND_STATUS = {
  pending_review: S('amber', 'بانتظار القرار', 'Awaiting decision'),
  approved: S('earth', 'موافق عليه', 'Approved'),
  succeeded: S('success', 'تم الاسترداد', 'Refunded'),
  rejected: S('danger', 'مرفوض', 'Declined'),
  failed: S('danger', 'فشل', 'Failed'),
};
export const REFUND_KIND = { user_request: ['طلب من المستخدم', 'User request'], admin_initiated: ['من الإدارة', 'Admin initiated'] };
export const REFUND_REASON = {
  LATE_PAYMENT: ['دفع متأخر', 'Late payment'],
  DUPLICATE_CHARGE: ['خصم مكرر', 'Duplicate charge'],
  SERVICE_ISSUE: ['مشكلة في الخدمة', 'Service issue'],
  EXPERT_NO_SHOW: ['غياب الخبير', 'Expert no-show'],
  GOODWILL: ['تعويض ودّي', 'Goodwill'],
  SESSION_NOT_HELD: ['الجلسة لم تُعقد', 'Session not held'],
  CHANGED_MIND: ['تغيّر الرأي', 'Changed mind'],
};
export const ATTEMPT_STATUS = {
  succeeded: S('success', 'ناجحة', 'Succeeded'),
  failed: S('danger', 'فاشلة', 'Failed'),
  processing: S('amber', 'قيد المعالجة', 'Processing'),
  requires_action: S('amber', 'تحتاج إجراءً', 'Requires action'),
};
export const RECON_STATUS = { open: S('amber', 'مفتوحة', 'Open'), resolved: S('success', 'تمت التسوية', 'Resolved') };
export const RECON_KIND = {
  duplicate_charge: ['خصم مكرر', 'Duplicate charge'],
  missing_webhook: ['إشعار Stripe مفقود', 'Missing Stripe webhook'],
  amount_mismatch: ['اختلاف في المبلغ', 'Amount mismatch'],
};
export const DISPUTE_STATUS = {
  needs_response: S('danger', 'يحتاج ردًا', 'Needs response'),
  under_review: S('amber', 'قيد المراجعة', 'Under review'),
  won: S('success', 'ربحنا النزاع', 'Won'),
  lost: S('neutral', 'خسرنا النزاع', 'Lost'),
};
export const DISPUTE_REASON = {
  product_not_received: ['الخدمة لم تُستلم', 'Service not received'],
  fraudulent: ['عملية احتيالية', 'Fraudulent'],
  duplicate: ['مكررة', 'Duplicate'],
  general: ['عام', 'General'],
};
export const STRIPE_ACCOUNT_STATUS = {
  ...USER_STRIPE_STATUS,
  disabled: S('neutral', 'معطّل', 'Disabled'),
};
export const LEDGER_TYPE = {
  charge: S('success', 'دفعة', 'Charge'),
  platform_fee: S('olive', 'عمولة المنصة', 'Platform fee'),
  expert_payable: S('earth', 'مستحق للخبير', 'Expert payable'),
  refund: S('danger', 'استرداد', 'Refund'),
};

export const DATA_REQUEST_STATUS = {
  requested: S('amber', 'مستلم', 'Received'),
  processing: S('peach', 'قيد المعالجة', 'Processing'),
  completed: S('success', 'مكتمل', 'Completed'),
  deferred: S('earth', 'مؤجَّل', 'Deferred'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
};
export const DATA_REQUEST_TYPE = { export: ['تصدير البيانات', 'Data export'], deletion: ['حذف الحساب', 'Account deletion'] };
export const DATA_REQUEST_REASON = {
  ACTIVE_FINANCIAL_OBLIGATION: ['التزام مالي قائم', 'Active financial obligation'],
  IDENTITY_NOT_CONFIRMED: ['لم يتم تأكيد الهوية', 'Identity not confirmed'],
};
export const CONSENT_PURPOSE = {
  ai_processing: ['معالجة الذكاء الاصطناعي', 'AI processing'],
  expert_sharing: ['مشاركة الحالة مع الخبراء', 'Sharing with experts'],
  marketing: ['الرسائل التسويقية', 'Marketing messages'],
};
export const CONSENT_DECISION = {
  granted: S('success', 'موافق', 'Granted'),
  declined: S('danger', 'مرفوض', 'Declined'),
  withdrawn: S('neutral', 'مسحوب', 'Withdrawn'),
};

export const DOMAINS = {
  legal: ['قانوني', 'Legal'], tax: ['ضريبي', 'Tax'], ip: ['ملكية فكرية', 'Intellectual property'], biz: ['أعمال', 'Business'], technology: ['تقنية', 'Technology'],
  finance: ['مالي', 'Finance'], accounting: ['محاسبة', 'Accounting'], engineering: ['هندسة', 'Engineering'], medical: ['طبي', 'Medical'], design: ['تصميم', 'Design'], marketing: ['تسويق', 'Marketing'],
};
export const SERVICE_TYPES = {
  written_consultation: ['استشارة كتابية', 'Written consultation'], video_consultation: ['استشارة فيديو', 'Video consultation'], audio_consultation: ['استشارة صوتية', 'Audio consultation'],
  document_review: ['مراجعة مستندات', 'Document review'], project_advisory: ['مرافقة استشارية', 'Project advisory'],
};
export const LANGUAGES = { ar: ['العربية', 'Arabic'], en: ['الإنجليزية', 'English'], fr: ['الفرنسية', 'French'], tr: ['التركية', 'Turkish'] };
export const COUNTRIES = {
  AE: ['الإمارات', 'UAE'], SA: ['السعودية', 'Saudi Arabia'], EG: ['مصر', 'Egypt'], JO: ['الأردن', 'Jordan'], KW: ['الكويت', 'Kuwait'], QA: ['قطر', 'Qatar'], LB: ['لبنان', 'Lebanon'], PS: ['فلسطين', 'Palestine'],
};


export const CASE_TIMELINE = {
  'case.created': ['تم إنشاء الحالة', 'Case created'],
  'case.submitted': ['أُرسلت الحالة للمطابقة', 'Case submitted for matching'],
  'case.cancelled': ['أُلغيت الحالة', 'Case cancelled'],
  'invitation.sent': ['دعوة أُرسلت إلى خبير', 'Invitation sent to an expert'],
  'proposal.submitted': ['عرض مقدَّم من خبير', 'Proposal submitted'],
  'agreement.created': ['اتفاقية أُنشئت', 'Agreement created'],
  'funding.created': ['طلب تمويل أُنشئ', 'Funding created'],
  'session.scheduled': ['جلسة مجدولة', 'Session scheduled'],
  'session.completed': ['جلسة منجزة', 'Session completed'],
};

export const REASON_CODES = {
  POLICY_VERIFIED: ['السياسة موثّقة', 'Policy verified'],
  POLICY_UPDATED: ['تحديث السياسة', 'Policy updated'],
  SAFETY_REVIEW: ['مراجعة سلامة', 'Safety review'],
  REGULATORY_CHANGE: ['تغيّر تنظيمي', 'Regulatory change'],
  EXPERT_SUPPLY: ['توفر الخبراء', 'Expert supply'],
  LICENCE_VERIFIED: ['الرخصة موثّقة', 'Licence verified'],
  LICENCE_EXPIRED: ['الرخصة منتهية', 'Licence expired'],
  POLICY_CHANGED: ['تغيّرت السياسة', 'Policy changed'],
};
export const CATALOG_COUNTRIES = ['AE', 'SA', 'EG', 'JO', 'KW'];

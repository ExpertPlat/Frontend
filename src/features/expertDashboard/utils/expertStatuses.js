import { getStatusMeta } from '../../kyc/data/kycStore';

/** Tone/label tables for the expert side. Labels are [ar, en]. */
const S = (tone, ar, en) => ({ tone, label: [ar, en] });

/** Where one client request stands, derived from the invitation + proposal + agreement + booking the API returned. */
export const REQUEST_STAGE = {
  new: S('earth', 'طلب جديد', 'New request'),
  proposal: S('warning', 'بانتظار عرضك', 'Your proposal is due'),
  waiting: S('amber', 'بانتظار رد العميل', 'Waiting for the client'),
  revise: S('warning', 'مطلوب تعديل العرض', 'Changes requested'),
  payment: S('amber', 'بانتظار دفع العميل', 'Waiting for payment'),
  booking: S('amber', 'بانتظار حجز العميل', 'Waiting for booking'),
  session: S('success', 'الجلسة محجوزة', 'Session booked'),
  done: S('olive', 'مكتمل', 'Completed'),
  closed: S('neutral', 'مغلق', 'Closed'),
};

/** Label of the button that opens a request, by stage. */
export const REQUEST_ACTION = {
  new: ['راجع الطلب', 'Review'], proposal: ['اكتب العرض', 'Write proposal'], revise: ['عدّل العرض', 'Revise'],
};

export const REQUEST_STEPS = ['request', 'proposal', 'payment', 'session'];

/** Index (0-3) of the step a request has reached, for the progress bar. */
export function requestStep(stage) {
  return { new: 0, proposal: 1, waiting: 1, revise: 1, payment: 2, booking: 3, session: 3, done: 3, closed: 0 }[stage] ?? 0;
}

export function stageOfRequest({ invitation, proposal, agreement, booking }) {
  if (invitation.status === 'pending') return invitation.expiresAt && new Date(invitation.expiresAt) < new Date() ? 'closed' : 'new';
  if (['declined', 'expired', 'revoked'].includes(invitation.status)) return 'closed';
  if (!proposal) return 'proposal';
  if (['rejected', 'withdrawn', 'expired'].includes(proposal.status)) return 'closed';
  if (proposal.status === 'change_requested') return 'revise';
  if (proposal.status === 'submitted') return 'waiting';
  if (!agreement) return 'waiting';
  if (agreement.status === 'cancelled') return 'closed';
  if (agreement.status === 'completed') return 'done';
  if (agreement.status === 'awaiting_payment') return 'payment';
  if (!booking) return 'booking';
  return booking.status === 'completed' ? 'done' : 'session';
}

/** Needs the expert's action right now. */
export const NEEDS_ACTION = ['new', 'proposal', 'revise'];
export const IS_OPEN = (stage) => !['closed', 'done'].includes(stage);

/** Account-level KYC (Expert.kyc_status): approved / pending / rejected / not_submitted. */
export const ACCOUNT_KYC = {
  approved: S('success', 'معتمد', 'Verified'),
  pending: S('warning', 'قيد المراجعة', 'Under review'),
  rejected: S('danger', 'مرفوض', 'Rejected'),
  not_submitted: S('neutral', 'غير موثّق', 'Not verified'),
};

/** Application-level status (draft, submitted, under_review, needs_information, verified, rejected) -> pill. */
export function kycPill(status) {
  const meta = getStatusMeta(status);
  return { tone: meta.tone === 'review' ? 'earth' : meta.tone, label: [meta.ar, meta.en] };
}

export const PUBLICATION_LABEL = {
  kyc_approval: ['اعتماد التحقق من الهوية', 'Identity verification approved'],
  professional_title: ['المسمى المهني', 'Professional title'],
  bio: ['نبذة تعريفية (80 حرفًا على الأقل)', 'Bio (at least 80 characters)'],
  public_languages: ['لغة ظاهرة واحدة على الأقل', 'At least one public language'],
  verified_scope: ['نطاق مهني موثّق ساري', 'A valid verified scope'],
  service_modes: ['نوع خدمة واحد على الأقل', 'At least one service type'],
  weekly_schedule: ['يوم عمل واحد على الأقل في الإتاحة', 'At least one working day in availability'],
};

export const SERVICE_MODE_LABEL = {
  written_consultation: ['استشارة مكتوبة', 'Written consultation'],
  video_consultation: ['استشارة بالفيديو', 'Video consultation'],
  audio_consultation: ['استشارة صوتية', 'Audio consultation'],
  document_review: ['مراجعة مستندات', 'Document review'],
  project_advisory: ['مرافقة استشارية', 'Project advisory'],
};

export const LANGUAGE_LABEL = { ar: ['العربية', 'Arabic'], en: ['الإنجليزية', 'English'], fr: ['الفرنسية', 'French'], tr: ['التركية', 'Turkish'] };
export const DAY_LABEL = { mon: ['الاثنين', 'Monday'], tue: ['الثلاثاء', 'Tuesday'], wed: ['الأربعاء', 'Wednesday'], thu: ['الخميس', 'Thursday'], fri: ['الجمعة', 'Friday'], sat: ['السبت', 'Saturday'], sun: ['الأحد', 'Sunday'] };
export const TIMEZONES = ['Asia/Dubai', 'Asia/Riyadh', 'Asia/Amman', 'Asia/Hebron', 'Africa/Cairo', 'Asia/Kuwait', 'Asia/Qatar', 'Europe/London'];

export const SCOPE_STATUS = { active: S('success', 'ساري', 'Active'), expiring: S('amber', 'قارب على الانتهاء', 'Expiring soon'), expired: S('danger', 'منتهٍ', 'Expired'), suspended: S('danger', 'موقوف', 'Suspended'), revoked: S('danger', 'مسحوب', 'Revoked') };
export const RENEWAL_STATUS = {
  draft: S('neutral', 'مسودة', 'Draft'), submitted: S('warning', 'قيد المراجعة', 'Submitted'), under_review: S('earth', 'قيد المراجعة', 'Under review'),
  needs_information: S('warning', 'مطلوب معلومات', 'Needs information'), approved: S('success', 'معتمد', 'Approved'), rejected: S('danger', 'مرفوض', 'Rejected'), cancelled: S('neutral', 'ملغى', 'Cancelled'),
};

export const DOMAIN_LABEL = { legal: ['قانوني', 'Legal'], biz: ['أعمال', 'Business'], tax: ['ضرائب', 'Tax'] };
export const ROLE_LABEL = { attorney: ['محامٍ', 'Attorney'], advisor: ['مستشار', 'Advisor'], accountant: ['محاسب', 'Accountant'], consultant: ['استشاري', 'Consultant'] };
export const MISSING_TARGET = { kyc_approval: 'kyc', professional_title: 'profile', bio: 'profile', public_languages: 'profile', verified_scope: 'scopes', service_modes: 'availability', weekly_schedule: 'availability' };

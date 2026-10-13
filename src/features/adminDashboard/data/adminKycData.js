import {
  collectKycDocuments,
  getKycDecisionReason,
  getKycReviewFeedback,
  getStatusMeta,
  normalizeKycStatus,
} from '../../kyc/data/kycStore.js';

const ADMIN_FILTER_STATUS_CODES = ['submitted', 'under_review', 'needs_information', 'verified', 'rejected'];

export const ADMIN_KYC_FILTERS = Object.freeze([
  { value: '', label: 'الكل' },
  ...ADMIN_FILTER_STATUS_CODES.map((value) => ({ value, label: getStatusMeta(value).ar })),
]);

function valueOrDash(value) {
  return value === undefined || value === null || value === '' ? '—' : value;
}

function normalizeApplication(raw) {
  const source = raw?.application && typeof raw.application === 'object' ? raw.application : (raw || {});
  const identity = source.identityAndScope || source.identity_and_scope || {};
  return {
    ...source,
    fullName: source.fullName || source.full_name || identity.fullName || identity.full_name || '',
    email: source.email || identity.email || '',
    country: source.country || identity.country || '',
    language: source.language || identity.language || '',
    domain: source.domain || identity.domain || '',
    jurisdiction: source.jurisdiction || identity.jurisdiction || '',
    experiences: source.experiences || [],
    qualifications: source.qualifications || [],
    credentials: source.credentials || [],
    workSamples: source.workSamples || source.work_samples || [],
  };
}

export function normalizeAdminKycApplication(raw) {
  const source = raw?.data && typeof raw.data === 'object' ? raw.data : (raw || {});
  const application = normalizeApplication(source.application || source);
  const expert = source.expert || application.expert || {};
  const statusCode = normalizeKycStatus(application.status || source.status || source.applicationStatus || source.kycStatus);
  const meta = getStatusMeta(statusCode);
  const documents = collectKycDocuments(application, source.documents);
  const reviewer = source.reviewedBy || source.reviewed_by || source.reviewer || application.reviewedBy || application.reviewed_by || null;
  const history = source.statusHistory || source.status_history || source.transitions || application.statusHistory || application.status_history || [];
  const reviewFeedback = getKycReviewFeedback(source);

  return {
    id: source.id ?? source.applicationId ?? application.id,
    reference: source.reference || application.reference || `KYC-${source.id ?? application.id ?? ''}`,
    statusCode,
    status: meta.ar,
    tone: meta.tone,
    name: expert.name || expert.fullName || expert.full_name || application.fullName || '—',
    email: expert.email || application.email || '—',
    phone: expert.phone || expert.mobile || '—',
    domain: valueOrDash(application.domain),
    jurisdiction: valueOrDash(application.jurisdiction),
    country: valueOrDash(application.country),
    language: valueOrDash(application.language),
    submittedAt: source.submittedAt || source.submitted_at || application.submittedAt || application.submitted_at || null,
    updatedAt: source.updatedAt || source.updated_at || application.updatedAt || application.updated_at || null,
    reviewedAt: source.reviewStartedAt
      || source.review_started_at
      || source.reviewedAt
      || source.reviewed_at
      || application.reviewStartedAt
      || application.review_started_at
      || application.reviewedAt
      || application.reviewed_at
      || null,
    reviewer,
    history: Array.isArray(history) ? history : [],
    decisionReason: getKycDecisionReason(source),
    requestedChanges: reviewFeedback?.requestedChanges || [],
    reviewFeedback,
    professionalReviews: Array.isArray(source.professionalReviews || application.professionalReviews) ? (source.professionalReviews || application.professionalReviews) : [],
    verifiedScopes: Array.isArray(application.verifiedScopes) ? application.verifiedScopes : [],
    documentsCount: Number(source.documentsCount ?? source.documents_count ?? application.documentsCount ?? documents.length),
    documents,
    application,
    raw: source,
  };
}

export function normalizeAdminKycListResponse(payload) {
  const data = payload?.data || {};
  const applications = Array.isArray(data.applications) ? data.applications.map(normalizeAdminKycApplication) : [];
  const pagination = data.pagination || {};
  return {
    applications,
    pagination: {
      currentPage: Number(pagination.currentPage || pagination.current_page || 1),
      lastPage: Number(pagination.lastPage || pagination.last_page || 1),
      perPage: Number(pagination.perPage || pagination.per_page || 20),
      total: Number(pagination.total || 0),
    },
  };
}

export const toneForKycStatus = (status) => getStatusMeta(status).tone;

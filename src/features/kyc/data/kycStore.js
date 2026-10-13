export const KYC_STATUS = Object.freeze({
  NOT_SUBMITTED: 'not_submitted',
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  NEEDS_INFORMATION: 'needs_information',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  PENDING: 'pending',
  APPROVED: 'approved',
  UNKNOWN: 'unknown',
});

// Application statuses and account-level kyc_status values are intentionally kept
// distinct. The frontend must not silently translate backend lifecycle states.
export const KYC_STATUS_META = Object.freeze({
  not_submitted: {
    ar: 'لم يُقدّم', en: 'Not submitted', tone: 'neutral', editable: true, canSubmit: true,
    descriptionAr: 'لم يبدأ طلب التحقق بعد. يمكنك إنشاء المسودة وإرسالها للمراجعة.',
  },
  draft: {
    ar: 'مسودة', en: 'Draft', tone: 'neutral', editable: true, canSubmit: true,
    descriptionAr: 'يمكنك تعديل الطلب وحفظه وإرساله للمراجعة.',
  },
  submitted: {
    ar: 'مُقدّم', en: 'Submitted', tone: 'warning', editable: false, canSubmit: false,
    descriptionAr: 'تم إرسال الطلب وينتظر بدء المراجعة.',
  },
  under_review: {
    ar: 'قيد المراجعة', en: 'Under review', tone: 'review', editable: false, canSubmit: false,
    descriptionAr: 'الطلب قيد المراجعة ولا يمكن تعديله الآن.',
  },
  needs_information: {
    ar: 'معلومات إضافية مطلوبة', en: 'Needs information', tone: 'warning', editable: true, canSubmit: true,
    descriptionAr: 'طلب فريق المراجعة معلومات إضافية. عند أول حفظ ينشئ الخادم محاولة تعديل جديدة.',
  },
  verified: {
    ar: 'تم التحقق', en: 'Verified', tone: 'success', editable: false, canSubmit: false,
    descriptionAr: 'تم اعتماد محاولة KYC وإغلاقها أمام التعديل.',
  },
  rejected: {
    ar: 'مرفوض', en: 'Rejected', tone: 'danger', editable: true, canSubmit: true,
    descriptionAr: 'يمكنك مراجعة سبب الرفض وإنشاء محاولة جديدة من البيانات الحالية.',
  },
  pending: {
    ar: 'بانتظار القرار', en: 'Pending', tone: 'warning', editable: false, canSubmit: false,
    descriptionAr: 'حالة الحساب بانتظار قرار KYC. افتح الطلب لمعرفة حالته التفصيلية.',
  },
  approved: {
    ar: 'معتمد', en: 'Approved', tone: 'success', editable: false, canSubmit: false,
    descriptionAr: 'حالة KYC على الحساب معتمدة.',
  },
  unknown: {
    ar: 'حالة غير معروفة', en: 'Unknown status', tone: 'danger', editable: false, canSubmit: false,
    descriptionAr: 'أعاد الخادم حالة غير معروفة للواجهة. تم إيقاف التعديل كإجراء آمن.',
  },
});

export const KYC_REVIEW_SECTIONS = Object.freeze([
  { value: 'identity_scope', ar: 'الهوية ونطاق الممارسة', en: 'Identity & scope' },
  { value: 'experience', ar: 'السيرة الذاتية والخبرة', en: 'CV & experience' },
  { value: 'qualifications', ar: 'المؤهلات الأكاديمية', en: 'Qualifications' },
  { value: 'credentials', ar: 'الشهادات والتراخيص', en: 'Credentials' },
  { value: 'work_samples', ar: 'عينات العمل', en: 'Work samples' },
  { value: 'other', ar: 'معلومات أخرى', en: 'Other information' },
]);

export function normalizeKycStatus(status) {
  const value = typeof status === 'string' ? status.trim() : '';
  if (!value) return KYC_STATUS.UNKNOWN;
  return Object.prototype.hasOwnProperty.call(KYC_STATUS_META, value) ? value : KYC_STATUS.UNKNOWN;
}

export function getStatusMeta(status) {
  return KYC_STATUS_META[normalizeKycStatus(status)];
}

export function isKycEditable(status) {
  return getStatusMeta(status).editable;
}

export function unwrapKycPayload(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : {};
}

function normalizeDocument(document, typeOverride = '') {
  if (!document || typeof document !== 'object') return null;
  const id = document.id ?? document.documentId;
  if (id === undefined || id === null) return null;
  return {
    ...document,
    id,
    type: document.type || document.documentType || typeOverride,
    originalName: document.originalName || document.original_name || document.name || document.fileName || 'document',
    mimeType: document.mimeType || document.mime_type || document.typeMime || '',
    size: Number(document.size || 0),
    reviewed: Boolean(document.reviewed),
    reviewedAt: document.reviewedAt || document.reviewed_at || null,
    downloadUrl: document.downloadUrl || document.download_url || '',
    qualificationId: document.qualificationId ?? document.qualification_id ?? null,
    credentialId: document.credentialId ?? document.credential_id ?? null,
  };
}

function pushDocument(target, seen, rawDocument, typeOverride = '') {
  const document = normalizeDocument(rawDocument, typeOverride);
  if (!document) return;
  const key = String(document.id);
  if (seen.has(key)) return;
  seen.add(key);
  target.push(document);
}

export function collectKycDocuments(application = {}, extraDocuments = []) {
  const documents = [];
  const seen = new Set();
  const flat = [
    ...(Array.isArray(application.documents) ? application.documents : []),
    ...(Array.isArray(extraDocuments) ? extraDocuments : []),
  ];
  flat.forEach((document) => pushDocument(documents, seen, document));

  pushDocument(
    documents,
    seen,
    application.identityDocument ||
      application.identityEvidence ||
      application.identityAndScope?.identityEvidence ||
      application.identity,
    'identity',
  );
  pushDocument(documents, seen, application.cvDocument || application.cv, 'cv');

  (application.qualifications || []).forEach((item) => pushDocument(
    documents,
    seen,
    item.document || item.qualificationDocument,
    'qualification',
  ));
  (application.credentials || []).forEach((item) => pushDocument(
    documents,
    seen,
    item.document || item.credentialDocument,
    'credential',
  ));
  (application.workSamples || application.work_samples || []).forEach((item) => pushDocument(
    documents,
    seen,
    item.document || item,
    'work_sample',
  ));

  return documents;
}

function temporaryId(prefix, index) {
  return `${prefix}-local-${index}-${Date.now()}`;
}

function persistedId(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function documentForType(documents, type) {
  return documents.find((document) => document.type === type) || null;
}

function relatedDocument(documents, type, relationId, fallback) {
  const relationKey = type === 'qualification' ? 'qualificationId' : 'credentialId';
  const byId = documents.find((document) => document.type === type && String(document[relationKey]) === String(relationId));
  return byId || normalizeDocument(fallback, type);
}

export function expertKycToForm(payload) {
  const data = unwrapKycPayload(payload);
  const prefill = data.prefill && typeof data.prefill === 'object' ? data.prefill : {};
  const application = data.application && typeof data.application === 'object'
    ? data.application
    : {};

  const identityAndScope = application.identityAndScope
    && typeof application.identityAndScope === 'object'
    ? application.identityAndScope
    : {};

  const source = {
    ...prefill,
    ...identityAndScope,
    ...application,
  };
  const documents = collectKycDocuments(application, data.documents);

  const experiences = (source.experiences || []).map((entry, index) => ({
    id: entry.id ?? temporaryId('experience', index),
    jobTitle: entry.jobTitle || entry.job_title || '',
    organization: entry.organization || '',
    from: entry.from || '',
    to: entry.to || '',
    current: Boolean(entry.current),
    description: entry.description || '',
  }));

  const qualifications = (source.qualifications || []).map((entry, index) => ({
    id: entry.id ?? temporaryId('qualification', index),
    degree: entry.degree || '',
    field: entry.field || '',
    institution: entry.institution || '',
    graduationYear: entry.graduationYear || entry.graduation_year || '',
    document: relatedDocument(documents, 'qualification', entry.id, entry.document || entry.qualificationDocument),
  }));

  const credentials = (source.credentials || []).map((entry, index) => ({
    id: entry.id ?? temporaryId('credential', index),
    type: entry.type || 'certificate',
    name: entry.name || '',
    issuer: entry.issuer || '',
    issueDate: entry.issueDate || entry.issue_date || '',
    expiryDate: entry.expiryDate || entry.expiry_date || '',
    document: relatedDocument(documents, 'credential', entry.id, entry.document || entry.credentialDocument),
  }));

  return {
    fullName: source.fullName || source.full_name || '',
    email: source.email || '',
    country: /^[A-Za-z]{2}$/.test(String(source.country || '')) ? String(source.country).toUpperCase() : (source.country || ''),
    language: source.language || '',
    domain: source.domain || '',
    jurisdiction: source.jurisdiction || '',
    identityEvidence: documentForType(documents, 'identity'),
    cv: documentForType(documents, 'cv'),
    experiences,
    qualifications,
    credentials,
    workSamples: documents.filter((document) => document.type === 'work_sample'),
    payoutReadiness: source.payoutReadiness || source.payout_readiness || 'not_ready',
  };
}

export function expertKycDraftPayload(form) {
  const serializeId = (id) => {
    const value = persistedId(id);
    return value === undefined ? {} : { id: value };
  };

  return {
    fullName: String(form.fullName || '').trim(),
    country: /^[A-Za-z]{2}$/.test(String(form.country || '')) ? String(form.country).toUpperCase() : (form.country || ''),
    language: form.language || '',
    domain: form.domain || '',
    jurisdiction: String(form.jurisdiction || '').trim(),
    experiences: (form.experiences || []).map((entry) => ({
      ...serializeId(entry.id),
      jobTitle: String(entry.jobTitle || '').trim(),
      organization: String(entry.organization || '').trim(),
      from: entry.from || null,
      to: entry.current ? null : (entry.to || null),
      current: Boolean(entry.current),
      description: String(entry.description || '').trim(),
    })),
    qualifications: (form.qualifications || []).map((entry) => ({
      ...serializeId(entry.id),
      degree: String(entry.degree || '').trim(),
      field: String(entry.field || '').trim(),
      institution: String(entry.institution || '').trim(),
      graduationYear: String(entry.graduationYear || '').trim(),
    })),
    credentials: (form.credentials || []).map((entry) => ({
      ...serializeId(entry.id),
      type: entry.type || 'certificate',
      name: String(entry.name || '').trim(),
      issuer: String(entry.issuer || '').trim(),
      issueDate: entry.issueDate || null,
      expiryDate: entry.expiryDate || null,
    })),
  };
}

export function findPersistedKycChild(previousForm, persistedForm, collection, entryId) {
  const previousEntries = Array.isArray(previousForm?.[collection]) ? previousForm[collection] : [];
  const persistedEntries = Array.isArray(persistedForm?.[collection]) ? persistedForm[collection] : [];
  const sourceEntry = previousEntries.find((entry) => String(entry?.id) === String(entryId));
  if (!sourceEntry) return null;

  // Keep a stable server-owned relation whenever the same child survived the save.
  const exact = persistedEntries.find((entry) => String(entry?.id) === String(sourceEntry.id));
  if (exact) return exact;

  // A needs_information/rejected retry is cloned by Laravel with new child IDs
  // while preserving collection order. Use the source position only for that clone.
  const sourceIndex = previousEntries.indexOf(sourceEntry);
  return sourceIndex >= 0 ? persistedEntries[sourceIndex] || null : null;
}

export function findEditableKycDocument(previousForm, editableForm, document) {
  if (!document?.id) return null;

  const editableDocuments = collectKycDocuments({
    identityAndScope: { identityEvidence: editableForm?.identityEvidence },
    cv: editableForm?.cv,
    qualifications: editableForm?.qualifications || [],
    credentials: editableForm?.credentials || [],
    workSamples: editableForm?.workSamples || [],
  });
  const currentDocument = editableDocuments.find((item) => String(item.id) === String(document.id));
  if (currentDocument) return currentDocument;

  const type = document.type || document.documentType;
  if (type === 'identity') return editableForm?.identityEvidence || null;
  if (type === 'cv') return editableForm?.cv || null;

  if (type === 'qualification' || type === 'credential') {
    const collection = type === 'qualification' ? 'qualifications' : 'credentials';
    const sourceIndex = (previousForm?.[collection] || []).findIndex(
      (entry) => String(entry.document?.id) === String(document.id),
    );
    return sourceIndex >= 0 ? editableForm?.[collection]?.[sourceIndex]?.document || null : null;
  }

  if (type === 'work_sample') {
    const sourceIndex = (previousForm?.workSamples || []).findIndex(
      (item) => String(item.id) === String(document.id),
    );
    return sourceIndex >= 0 ? editableForm?.workSamples?.[sourceIndex] || null : null;
  }

  return null;
}

export function getExpertKycStatus(payload) {
  const data = unwrapKycPayload(payload);
  return normalizeKycStatus(
    data.application?.status
      || data.applicationStatus
      || data.application_status
      || data.kycStatus
      || data.kyc_status,
  );
}

export function getKycDecisionReason(payloadOrApplication) {
  const data = payloadOrApplication?.data || payloadOrApplication || {};
  const application = data.application || data;
  return application.reviewFeedback?.reason
    || application.review_feedback?.reason
    || application.decisionReason
    || application.decision_reason
    || application.review?.decisionReason
    || application.review?.decision_reason
    || application.reason
    || data.decisionReason
    || data.decision_reason
    || data.reason
    || '';
}

export function getKycReviewFeedback(payloadOrApplication) {
  const data = payloadOrApplication?.data || payloadOrApplication || {};
  const application = data.application || data;
  const feedback = application.reviewFeedback
    || application.review_feedback
    || application.revisionSource
    || application.revision_source
    || null;

  const reason = feedback?.reason || getKycDecisionReason(application);
  const rawChanges = feedback?.requestedChanges
    || feedback?.requested_changes
    || application.requestedChanges
    || application.requested_changes
    || [];

  if (!reason && !rawChanges.length) return null;

  return {
    status: normalizeKycStatus(feedback?.status || application.status),
    reason,
    sourceApplicationId: feedback?.sourceApplicationId ?? feedback?.source_application_id ?? null,
    sourceReference: feedback?.sourceReference || feedback?.source_reference || application.reference || '',
    sourceAttemptNumber: feedback?.sourceAttemptNumber ?? feedback?.source_attempt_number ?? null,
    decidedAt: feedback?.decidedAt || feedback?.decided_at || null,
    requestedChanges: rawChanges.map((change, index) => ({
      id: change.id || `${change.section || 'other'}-${change.documentId || change.document_id || index}`,
      section: change.section || 'other',
      field: change.field || '',
      documentId: change.documentId ?? change.document_id ?? null,
      message: change.message || '',
    })),
  };
}

export function getKycReviewSection(section, language = 'ar') {
  return KYC_REVIEW_SECTIONS.find((item) => item.value === section)?.[language]
    || KYC_REVIEW_SECTIONS.at(-1)?.[language]
    || section;
}

export function fileName(file) {
  return file?.originalName || file?.name || file?.fileName || file?.file || '';
}

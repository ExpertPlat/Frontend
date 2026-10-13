export const KYC_REGULATED_DOMAINS = Object.freeze([
  'legal', 'medical', 'health', 'finance', 'investment', 'tax', 'accounting', 'engineering',
]);

export const KYC_NON_REGULATED_DOMAINS = Object.freeze([
  'technology', 'design', 'marketing', 'career', 'education', 'translation', 'business',
]);

export function getKycVerificationPolicy(domain) {
  const normalized = String(domain || '').trim().toLowerCase();
  if (KYC_REGULATED_DOMAINS.includes(normalized)) return 'regulated';
  if (KYC_NON_REGULATED_DOMAINS.includes(normalized)) return 'non_regulated';
  return 'unsupported';
}

function reviewedDocument(document) {
  return Boolean(document?.reviewed || document?.reviewedAt || document?.reviewed_at);
}

function matchingDocument(documents, id) {
  return (documents || []).find((document) => String(document?.id) === String(id)) || null;
}

function embeddedOrCollectedDocument(item, documents) {
  const embedded = item?.document || item?.qualificationDocument || item?.credentialDocument || null;
  if (embedded?.id) return matchingDocument(documents, embedded.id) || embedded;
  return embedded;
}

export function buildKycEvidenceCandidates(application = {}, documents = [], policy = getKycVerificationPolicy(application?.domain)) {
  const candidates = [];
  const cvOrWorkSample = (documents || []).find((document) => (
    (document?.type === 'cv' || document?.type === 'work_sample') && reviewedDocument(document)
  ));

  (application.credentials || []).forEach((credential) => {
    const document = embeddedOrCollectedDocument(credential, documents);
    const isLicense = String(credential?.type || '').toLowerCase() === 'license';
    const expiryDate = credential?.expiryDate || credential?.expiry_date || '';
    const today = new Date().toISOString().slice(0, 10);
    const expired = Boolean(expiryDate && String(expiryDate).slice(0, 10) <= today);
    const eligible = reviewedDocument(document) && !expired && (policy !== 'regulated' || isLicense);
    const reason = expired
      ? 'منتهي الصلاحية'
      : !document
        ? 'لا يوجد مستند مرتبط'
        : !reviewedDocument(document)
          ? 'المستند لم تتم مراجعته'
          : policy === 'regulated' && !isLicense
            ? 'المجال المنظم يتطلب رخصة مهنية'
            : '';
    candidates.push({
      type: 'credential',
      id: credential.id,
      label: credential.name || `Credential #${credential.id}`,
      description: [credential.type, credential.issuer, credential.expiryDate || credential.expiry_date].filter(Boolean).join(' · '),
      document,
      credential,
      eligible,
      reason,
    });
  });

  if (policy !== 'regulated') {
    (application.qualifications || []).forEach((qualification) => {
      const document = embeddedOrCollectedDocument(qualification, documents);
      candidates.push({
        type: 'qualification',
        id: qualification.id,
        label: [qualification.degree, qualification.field].filter(Boolean).join(' — ') || `Qualification #${qualification.id}`,
        description: qualification.institution || '',
        document,
        qualification,
        eligible: reviewedDocument(document),
        reason: !document ? 'لا يوجد مستند مرتبط' : !reviewedDocument(document) ? 'المستند لم تتم مراجعته' : '',
      });
    });

    (application.experiences || []).forEach((experience) => {
      candidates.push({
        type: 'experience',
        id: experience.id,
        label: experience.jobTitle || experience.job_title || `Experience #${experience.id}`,
        description: experience.organization || '',
        document: cvOrWorkSample || null,
        experience,
        eligible: Boolean(cvOrWorkSample),
        reason: cvOrWorkSample ? '' : 'الخبرة تحتاج CV أو عينة عمل تمت مراجعتها',
      });
    });
  }

  return candidates.filter((candidate) => candidate.id !== undefined && candidate.id !== null);
}

export function buildKycApprovalScope(application = {}, approval = {}, policy = getKycVerificationPolicy(application?.domain)) {
  const scope = {
    domain: application.domain,
    jurisdiction: application.jurisdiction,
    ...(approval.jurisdictionCountry ? { jurisdictionCountry: String(approval.jurisdictionCountry).trim().toUpperCase() } : {}),
    role: String(approval.role || '').trim(),
    serviceTypes: Array.isArray(approval.serviceTypes) ? approval.serviceTypes : [],
    languages: Array.isArray(approval.languages) ? approval.languages : [],
    validUntil: approval.validUntil || null,
    evidence: {
      type: approval.evidenceType,
      id: Number(approval.evidenceId),
    },
  };

  if (policy === 'regulated') {
    const country = String(approval.jurisdictionCountry || '').trim().toUpperCase();
    scope.jurisdictionCountry = country;
    scope.professionalReview = {
      verifiedCountry: country,
      regulator: String(approval.regulator || '').trim(),
      registrationNumber: String(approval.registrationNumber || '').trim(),
      verificationSource: String(approval.verificationSource || '').trim(),
      statusChecked: approval.statusChecked || 'active',
      nextReviewAt: approval.nextReviewAt || '',
    };
  }

  return scope;
}

export function isHttpsUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  expertKycDraftPayload,
  expertKycToForm,
  findEditableKycDocument,
  findPersistedKycChild,
  getExpertKycStatus,
  getKycDecisionReason,
  getKycReviewFeedback,
  getStatusMeta,
} from '../../src/features/kyc/data/kycStore.js';
import { normalizeAdminKycApplication } from '../../src/features/adminDashboard/data/adminKycData.js';

test('account and application KYC statuses are preserved exactly', () => {
  const payload = { data: { kycStatus: 'not_submitted', prefill: {}, application: null } };
  assert.equal(getExpertKycStatus(payload), 'not_submitted');
  assert.equal(getStatusMeta(getExpertKycStatus(payload)).editable, true);
});

test('detailed application status takes precedence over the coarse expert KYC status', () => {
  const cases = [
    ['submitted', 'pending'],
    ['under_review', 'pending'],
    ['needs_information', 'pending'],
    ['verified', 'approved'],
    ['rejected', 'rejected'],
  ];

  for (const [applicationStatus, accountStatus] of cases) {
    const payload = { data: { kycStatus: accountStatus, application: { status: applicationStatus } } };
    assert.equal(getExpertKycStatus(payload), applicationStatus);
  }
});

test('coarse account states are not silently mapped and unknown states fail closed', () => {
  assert.equal(getExpertKycStatus({ data: { kycStatus: 'approved' } }), 'approved');
  assert.equal(getExpertKycStatus({ data: { kycStatus: 'pending' } }), 'pending');
  assert.equal(getExpertKycStatus({ data: { kycStatus: 'requires_changes' } }), 'unknown');
  assert.equal(getStatusMeta('unknown').editable, false);
});

test('application values override prefill and backend IDs/documents are retained', () => {
  const payload = {
    data: {
      kycStatus: 'draft',
      prefill: { fullName: 'Prefill Name', country: 'PS', language: 'ar', domain: 'legal' },
      application: {
        fullName: 'Saved Name',
        jurisdiction: 'Jordan',
        experiences: [{ id: 41, jobTitle: 'Attorney', organization: 'Firm', current: true }],
        qualifications: [{ id: 51, degree: 'LLM', institution: 'University' }],
        credentials: [{ id: 61, type: 'license', name: 'Bar', issuer: 'Authority' }],
        documents: [
          { id: 1, type: 'identity', originalName: 'id.pdf' },
          { id: 2, type: 'qualification', qualificationId: 51, originalName: 'degree.pdf' },
          { id: 3, type: 'credential', credentialId: 61, originalName: 'license.pdf' },
        ],
      },
    },
  };

  const form = expertKycToForm(payload);
  assert.equal(form.fullName, 'Saved Name');
  assert.equal(form.country, 'PS');
  assert.equal(form.experiences[0].id, 41);
  assert.equal(form.qualifications[0].document.id, 2);
  assert.equal(form.credentials[0].document.id, 3);
  assert.equal(form.identityEvidence.originalName, 'id.pdf');
});

test('draft payload keeps backend IDs but omits client-only IDs', () => {
  const payload = expertKycDraftPayload({
    fullName: ' Ahmad Ali ', country: 'JO', language: 'ar', domain: 'legal', jurisdiction: ' Jordan ',
    experiences: [
      { id: 9, jobTitle: 'Attorney', organization: 'Firm', from: '2020-01', to: '', current: true, description: '' },
      { id: 'experience-local-1', jobTitle: 'Advisor', organization: 'Office', from: '', to: '', current: false, description: '' },
    ],
    qualifications: [{ id: 12, degree: 'LLM', field: 'Law', institution: 'U', graduationYear: '2020' }],
    credentials: [{ id: 'credential-local-1', type: 'license', name: 'Bar', issuer: 'A', issueDate: '', expiryDate: '' }],
  });

  assert.equal(payload.fullName, 'Ahmad Ali');
  assert.equal(payload.jurisdiction, 'Jordan');
  assert.equal(payload.experiences[0].id, 9);
  assert.equal('id' in payload.experiences[1], false);
  assert.equal(payload.qualifications[0].id, 12);
  assert.equal('id' in payload.credentials[0], false);
  assert.equal(payload.experiences[0].to, null);
});

test('child relations keep the server ID after save and resolve cloned retry IDs by source position', () => {
  const previous = { credentials: [{ id: 40 }, { id: 'credential-local-2' }] };
  const saved = { credentials: [{ id: 40 }, { id: 75 }] };
  assert.equal(findPersistedKycChild(previous, saved, 'credentials', 40).id, 40);
  assert.equal(findPersistedKycChild(previous, saved, 'credentials', 'credential-local-2').id, 75);

  const retrySource = { credentials: [{ id: 40 }, { id: 41 }] };
  const clonedRetry = { credentials: [{ id: 140 }, { id: 141 }] };
  assert.equal(findPersistedKycChild(retrySource, clonedRetry, 'credentials', 41).id, 141);
});

test('a document from the reviewed attempt resolves to its cloned retry document', () => {
  const previousForm = {
    identityEvidence: { id: 10, type: 'identity' },
    cv: { id: 20, type: 'cv' },
    qualifications: [{ id: 30, document: { id: 31, type: 'qualification' } }],
    credentials: [{ id: 40, document: { id: 41, type: 'credential' } }],
    workSamples: [{ id: 50, type: 'work_sample' }],
  };
  const editableForm = {
    identityEvidence: { id: 110, type: 'identity' },
    cv: { id: 120, type: 'cv' },
    qualifications: [{ id: 130, document: { id: 131, type: 'qualification' } }],
    credentials: [{ id: 140, document: { id: 141, type: 'credential' } }],
    workSamples: [{ id: 150, type: 'work_sample' }],
  };

  assert.equal(findEditableKycDocument(previousForm, editableForm, previousForm.cv).id, 120);
  assert.equal(findEditableKycDocument(previousForm, editableForm, previousForm.qualifications[0].document).id, 131);
  assert.equal(findEditableKycDocument(previousForm, editableForm, previousForm.credentials[0].document).id, 141);
  assert.equal(findEditableKycDocument(previousForm, editableForm, previousForm.workSamples[0]).id, 150);
});

test('decision reason is read from review/application response variants', () => {
  assert.equal(getKycDecisionReason({ data: { application: { review: { decisionReason: 'Need clearer ID' } } } }), 'Need clearer ID');
  assert.equal(getKycDecisionReason({ application: { reason: 'Rejected reason' } }), 'Rejected reason');
});

test('structured review feedback remains actionable on a cloned retry draft', () => {
  const payload = {
    data: {
      kycStatus: 'pending',
      application: {
        status: 'draft',
        reviewFeedback: {
          status: 'needs_information',
          reason: 'Please update the identity evidence.',
          sourceApplicationId: 10,
          requestedChanges: [{
            section: 'identity_scope',
            field: 'identityEvidence',
            documentId: 99,
            message: 'Upload an uncropped image.',
          }],
        },
      },
    },
  };

  assert.equal(getExpertKycStatus(payload), 'draft');
  const feedback = getKycReviewFeedback(payload);
  assert.equal(feedback.reason, 'Please update the identity evidence.');
  assert.equal(feedback.sourceApplicationId, 10);
  assert.equal(feedback.requestedChanges[0].documentId, 99);
  assert.equal(feedback.requestedChanges[0].message, 'Upload an uncropped image.');
});

test('admin summary keeps server document count and review-start timestamp', () => {
  const application = normalizeAdminKycApplication({
    id: 15,
    reference: 'KYC-15',
    status: 'under_review',
    documentsCount: 4,
    reviewStartedAt: '2026-09-17T10:00:00Z',
    expert: { name: 'Expert', email: 'expert@example.com' },
  });

  assert.equal(application.documentsCount, 4);
  assert.equal(application.reviewedAt, '2026-09-17T10:00:00Z');
});

test('admin detail reads verified scope fields from identityAndScope resource', () => {
  const normalized = normalizeAdminKycApplication({ data: { application: {
    id: 18,
    status: 'under_review',
    identityAndScope: {
      fullName: 'Ahmad Ali', email: 'ahmad@example.com', country: 'JO',
      language: 'ar', domain: 'legal', jurisdiction: 'Jordan',
    },
    expert: { name: 'Ahmad Ali', email: 'ahmad@example.com' },
  } } });
  assert.equal(normalized.application.domain, 'legal');
  assert.equal(normalized.application.jurisdiction, 'Jordan');
  assert.equal(normalized.application.language, 'ar');
});


test('admin detail keeps private professional reviews for Admin UI only', () => {
  const normalized = normalizeAdminKycApplication({ data: { application: {
    id: 19,
    status: 'verified',
    identityAndScope: { domain: 'legal', jurisdiction: 'Jordan' },
    professionalReviews: [{
      scopeId: 3,
      evidenceType: 'credential',
      evidenceId: 11,
      evidenceDocumentId: 101,
      verifiedCountry: 'JO',
      regulator: 'Authority',
      registrationNumber: 'REG-11',
      verificationSource: 'https://authority.example/11',
      statusChecked: 'active',
      checkedAt: '2026-09-29T12:00:00Z',
      nextReviewAt: '2027-03-29',
    }],
  } } });
  assert.equal(normalized.professionalReviews.length, 1);
  assert.equal(normalized.professionalReviews[0].registrationNumber, 'REG-11');
  assert.equal(normalized.professionalReviews[0].verifiedCountry, 'JO');
});

test('KYC service declares every required expert/admin endpoint with scoped auth', async () => {
  const source = await readFile(new URL('../../src/services/kyc/kycService.js', import.meta.url), 'utf8');
  const requiredFragments = [
    '/api/expert/kyc', '/documents', '/submit',
    '/api/admin/kyc/applications', '/start-review', '/review', '/approve', '/reject', '/request-information',
    "authType: 'expert'", "authType: 'admin'",
  ];
  for (const fragment of requiredFragments) assert.match(source, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKycApprovalScope,
  buildKycEvidenceCandidates,
  getKycVerificationPolicy,
  isHttpsUrl,
} from '../../src/features/adminDashboard/data/adminKycVerification.js';

test('verification policy matches the backend Sprint 0 catalogue', () => {
  assert.equal(getKycVerificationPolicy('legal'), 'regulated');
  assert.equal(getKycVerificationPolicy('engineering'), 'regulated');
  assert.equal(getKycVerificationPolicy('technology'), 'non_regulated');
  assert.equal(getKycVerificationPolicy('unknown-domain'), 'unsupported');
});

test('regulated evidence only enables a reviewed unexpired licence from the current application', () => {
  const application = {
    domain: 'legal',
    credentials: [
      { id: 11, type: 'license', name: 'Bar licence', expiryDate: '2099-12-31', document: { id: 101 } },
      { id: 12, type: 'certificate', name: 'Course', document: { id: 102 } },
    ],
    qualifications: [{ id: 21, degree: 'LLB', document: { id: 201 } }],
  };
  const documents = [
    { id: 101, type: 'credential', originalName: 'licence.pdf', reviewed: true },
    { id: 102, type: 'credential', originalName: 'course.pdf', reviewed: true },
    { id: 201, type: 'qualification', originalName: 'degree.pdf', reviewed: true },
  ];
  const candidates = buildKycEvidenceCandidates(application, documents, 'regulated');
  assert.equal(candidates.length, 2);
  assert.equal(candidates.find((candidate) => candidate.id === 11).eligible, true);
  assert.equal(candidates.find((candidate) => candidate.id === 12).eligible, false);
  assert.equal(candidates.some((candidate) => candidate.type === 'qualification'), false);
});

test('non-regulated experience requires a reviewed CV or work sample', () => {
  const application = {
    domain: 'technology',
    experiences: [{ id: 31, jobTitle: 'Software Engineer', organization: 'SolveIt' }],
  };
  const blocked = buildKycEvidenceCandidates(application, [{ id: 301, type: 'cv', reviewed: false }], 'non_regulated');
  assert.equal(blocked[0].eligible, false);

  const allowed = buildKycEvidenceCandidates(application, [{ id: 301, type: 'cv', reviewed: true }], 'non_regulated');
  assert.equal(allowed[0].eligible, true);
  assert.equal(allowed[0].document.id, 301);
});

test('regulated approval payload exactly follows ADR-002 and does not invent credentialId/reviewedAt', () => {
  const scope = buildKycApprovalScope({ domain: 'legal', jurisdiction: 'Jordan' }, {
    role: 'Legal consultant',
    serviceTypes: ['written_consultation'],
    languages: ['ar'],
    evidenceType: 'credential',
    evidenceId: '123',
    jurisdictionCountry: 'jo',
    regulator: 'Relevant professional authority',
    registrationNumber: 'EXAMPLE-123',
    verificationSource: 'https://authority.example/register/123',
    statusChecked: 'active',
    nextReviewAt: '2099-03-28',
    validUntil: '',
  }, 'regulated');

  assert.deepEqual(scope, {
    domain: 'legal',
    jurisdiction: 'Jordan',
    jurisdictionCountry: 'JO',
    role: 'Legal consultant',
    serviceTypes: ['written_consultation'],
    languages: ['ar'],
    validUntil: null,
    evidence: { type: 'credential', id: 123 },
    professionalReview: {
      verifiedCountry: 'JO',
      regulator: 'Relevant professional authority',
      registrationNumber: 'EXAMPLE-123',
      verificationSource: 'https://authority.example/register/123',
      statusChecked: 'active',
      nextReviewAt: '2099-03-28',
    },
  });
  assert.equal('credentialId' in scope, false);
  assert.equal('reviewedAt' in scope, false);
});

test('non-regulated approval sends evidence without professionalReview', () => {
  const scope = buildKycApprovalScope({ domain: 'technology', jurisdiction: 'Jordan' }, {
    role: 'Software consultant',
    serviceTypes: ['written_consultation'],
    languages: ['ar', 'en'],
    evidenceType: 'experience',
    evidenceId: 456,
    jurisdictionCountry: 'JO',
    validUntil: '',
  }, 'non_regulated');
  assert.deepEqual(scope.evidence, { type: 'experience', id: 456 });
  assert.equal(scope.professionalReview, undefined);
  assert.equal(scope.jurisdictionCountry, 'JO');
});

test('HTTPS source validation rejects non-HTTPS and malformed sources', () => {
  assert.equal(isHttpsUrl('https://authority.example/registry'), true);
  assert.equal(isHttpsUrl('http://authority.example/registry'), false);
  assert.equal(isHttpsUrl('not-a-url'), false);
});

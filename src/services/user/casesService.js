import { userApi } from '../http.js';
import { newIdempotencyKey } from '../idempotency.js';

const V2 = '/api/v2/user/cases';
const idem = (options) => ({ idempotencyKey: options?.idempotencyKey || newIdempotencyKey('case') });
const ev = (caseData) => ({ expectedVersion: caseData.version });

/** One case scope in the shape the API stores (catalog entry + delivery mode + jurisdictions); `confirmed` is the "included" tick. */
const scopeBody = (scope, caseData) => ({
  catalogEntryId: scope.catalogEntryId ?? scope.id,
  catalogVersion: scope.catalogVersion ?? 1,
  deliveryMode: scope.deliveryMode || 'video_consultation',
  jurisdictionCodes: scope.jurisdictionCodes || (caseData.caseCountry ? [caseData.caseCountry] : []),
  answers: scope.answers || {},
  confirmed: Boolean(scope.included),
});

/**
 * Case intake, assessment, AI questions and documents (API handoff sections 10-11).
 * Every state change sends the case `version` as `expectedVersion`; the response is the updated case (or a resource that
 * carries the new version), so callers chain `caseData = await casesService.xxx(caseData, ...)`. A 409 means "reload".
 */
export const casesService = Object.freeze({
  list: () => userApi.get(V2),
  get: (caseId) => userApi.get(`${V2}/${caseId}`),
  create: (payload, options) => userApi.post(V2, payload, idem(options)),
  update: (caseData, payload) => userApi.patch(`${V2}/${caseData.id}`, { ...ev(caseData), ...payload }),
  /** AI reads the story and returns summary, facts and ranked specialties (scopes). Resolves to { assessedAt, suitability, case }. */
  assess: (caseData) => userApi.post(`${V2}/${caseData.id}/assessment`, ev(caseData)),
  /** `scopes`: the case scopes with the user's `included` choice. */
  setScopes: (caseData, scopes) => userApi.put(`${V2}/${caseData.id}/scopes`, { ...ev(caseData), scopes: scopes.map((scope) => scopeBody(scope, caseData)) }),
  questionSet: (caseId) => userApi.get(`${V2}/${caseId}/ai-questions`),
  createQuestionSet: (caseData, { regenerate = false } = {}) => userApi.post(`${V2}/${caseData.id}/ai-questions`, { ...ev(caseData), regenerate }),
  /** `answers`: { [questionId]: optionIndex }. `set` is the question set (its `version` is the expectedVersion). */
  saveAnswers: (caseId, set, answers) => userApi.put(`${V2}/${caseId}/ai-questions/${set.id}/responses`, {
    expectedVersion: set.version ?? 1,
    responses: Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId) || questionId, action: 'answer', answer })),
  }),
  confirm: (caseData) => userApi.post(`${V2}/${caseData.id}/confirm`, { ...ev(caseData), confirmed: true }),
  /** selectedScopeIds: the included scopes; partialConsent is false unless the user explicitly accepts partial matching. */
  submit: (caseData, { selectedScopeIds, partialConsent = false } = {}, options) => userApi.post(`${V2}/${caseData.id}/submit`,
    { ...ev(caseData), selectedScopeIds: selectedScopeIds || (caseData.scopes || []).filter((s) => s.included).map((s) => s.id), partialConsent }, idem(options)),
  cancel: (caseData) => userApi.post(`${V2}/${caseData.id}/cancel`, ev(caseData)),
  readiness: (caseId) => userApi.get(`${V2}/${caseId}/readiness`),

  documents: Object.freeze({
    list: (caseId) => userApi.get(`/api/user/cases/${caseId}/documents`),
    /** Multipart: { expectedVersion, title, category, file }. */
    upload: (caseData, file, { title, category = 'other' } = {}) => {
      const body = new FormData();
      body.append('expectedVersion', String(caseData.version));
      body.append('title', title || file.name);
      body.append('category', category);
      body.append('file', file);
      return userApi.post(`/api/user/cases/${caseData.id}/documents`, body, { timeoutMs: 60000 });
    },
    remove: (caseId, documentId) => userApi.delete(`/api/user/cases/${caseId}/documents/${documentId}`),
  }),
});

import { userApi } from '../http.js';
import { newIdempotencyKey } from '../idempotency.js';

const V2 = '/api/v2/user/cases';
const ev = (caseData) => ({ expectedVersion: caseData.version });

/** Matching runs, case briefs and invitations (API handoff section 11). */
export const matchingService = Object.freeze({
  run: (caseData, scopeId) => userApi.post(`${V2}/${caseData.id}/scopes/${scopeId}/matching-runs`, ev(caseData)),
  /** One run per included specialty, merged into a single ranked list. `stale` runs are flagged for the UI. */
  async findExperts(caseData, scopes) {
    const runs = await Promise.all(scopes.map((scope) => matchingService.run(caseData, scope.id)));
    const candidates = runs.flatMap((run) => run.candidates.map((candidate) => ({ ...candidate, runId: run.id, stale: !!run.stale })));
    return { stale: runs.some((run) => run.stale), candidates: candidates.sort((a, b) => b.matchScore - a.matchScore) };
  },
  /** body: { contextSnapshotIds, documentIds, followUpKeys } - the documents the user chose to share. */
  previewBrief: (caseData, scopeId, { contextSnapshotIds = [], documentIds = [], followUpKeys = [] } = {}) => userApi.post(`${V2}/${caseData.id}/scopes/${scopeId}/briefs/preview`, { ...ev(caseData), contextSnapshotIds, documentIds, followUpKeys }),
  /** Approves the previewed brief: the same body plus `approved` and the preview's `contentHash`. */
  createBrief: (caseData, scopeId, preview, { contextSnapshotIds = [], documentIds = [], followUpKeys = [] } = {}, options) => userApi.post(`${V2}/${caseData.id}/scopes/${scopeId}/briefs`,
    { ...ev(caseData), contextSnapshotIds, documentIds, followUpKeys, approved: true, contentHash: preview?.contentHash }, { idempotencyKey: options?.idempotencyKey || newIdempotencyKey('brief') }),
});

export const invitationsService = Object.freeze({
  list: (caseId) => userApi.get(`${V2}/${caseId}/invitations`),
  get: (caseId, invitationId) => userApi.get(`${V2}/${caseId}/invitations/${invitationId}`),
  /** payload: { matchingRunId, candidateId, briefId, message? } */
  create: (caseId, { matchingRunId, candidateId, briefId, message }, options) => userApi.post(`${V2}/${caseId}/invitations`,
    { matchingRunId, candidateId, briefId, ...(message ? { message } : {}) }, { idempotencyKey: options?.idempotencyKey || newIdempotencyKey('invite') }),
  revoke: (caseId, invitation) => userApi.post(`${V2}/${caseId}/invitations/${invitation.id}/revoke`, { expectedVersion: invitation.version }),
});

import { transport as apiClient } from '../transport.js';

const EXPERT_BASE = '/api/expert/kyc';
const ADMIN_BASE = '/api/admin/kyc/applications';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function documentDownloadTarget(documentOrId, fallbackBase) {
  if (documentOrId && typeof documentOrId === 'object') {
    if (typeof documentOrId.downloadUrl === 'string' && documentOrId.downloadUrl.trim()) {
      return documentOrId.downloadUrl.trim();
    }
    return `${fallbackBase}/${encodeURIComponent(documentOrId.id)}`;
  }
  return `${fallbackBase}/${encodeURIComponent(documentOrId)}`;
}

function documentFormData({ documentType, file, qualificationId, credentialId }) {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);
  if (qualificationId !== undefined && qualificationId !== null && qualificationId !== '') {
    formData.append('qualificationId', String(qualificationId));
  }
  if (credentialId !== undefined && credentialId !== null && credentialId !== '') {
    formData.append('credentialId', String(credentialId));
  }
  return formData;
}

export const kycService = Object.freeze({
  getExpertKyc: () => apiClient.get(EXPERT_BASE, { authType: 'expert' }),
  saveExpertKycDraft: (data) => apiClient.put(EXPERT_BASE, data, { authType: 'expert' }),
  uploadExpertKycDocument: (data) => apiClient.post(
    `${EXPERT_BASE}/documents`,
    documentFormData(data),
    { authType: 'expert', timeoutMs: 60000 },
  ),
  deleteExpertKycDocument: (documentId) => apiClient.delete(
    `${EXPERT_BASE}/documents/${encodeURIComponent(documentId)}`,
    { authType: 'expert' },
  ),
  downloadExpertKycDocument: (documentOrId) => apiClient.getBlob(
    documentDownloadTarget(documentOrId, `${EXPERT_BASE}/documents`),
    { authType: 'expert', timeoutMs: 60000 },
  ),
  submitExpertKyc: () => apiClient.post(`${EXPERT_BASE}/submit`, undefined, { authType: 'expert' }),

  getAdminKycApplications: (params) => apiClient.get(
    `${ADMIN_BASE}${buildQuery(params)}`,
    { authType: 'admin' },
  ),
  getAdminKycApplication: (applicationId) => apiClient.get(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}`,
    { authType: 'admin' },
  ),
  startAdminKycReview: (applicationId) => apiClient.post(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/start-review`,
    undefined,
    { authType: 'admin' },
  ),
  reviewAdminKycDocument: (applicationId, documentId, reviewed) => apiClient.put(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/review`,
    { reviewed: Boolean(reviewed) },
    { authType: 'admin' },
  ),
  downloadAdminKycDocument: (applicationId, documentOrId) => apiClient.getBlob(
    documentDownloadTarget(documentOrId, `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/documents`),
    { authType: 'admin', timeoutMs: 60000 },
  ),
  approveAdminKyc: (applicationId, scopes) => apiClient.post(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/approve`,
    { scopes },
    { authType: 'admin' },
  ),
  rejectAdminKyc: (applicationId, reason) => apiClient.post(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/reject`,
    { reason },
    { authType: 'admin' },
  ),
  requestAdminKycInformation: (applicationId, reason, requestedChanges) => apiClient.post(
    `${ADMIN_BASE}/${encodeURIComponent(applicationId)}/request-information`,
    { reason, requestedChanges },
    { authType: 'admin' },
  ),
});

import { kycService } from '../../../services/kyc/kycService';
import { normalizeAdminKycListResponse } from './adminKycData';
import { adminCatalog, adminFinance, adminOversight, adminRenewals } from '../../../services/admin/adminApi';
import { ADMIN_PERMISSIONS as P } from '../../adminAuthorization/adminPermissions';

/**
 * Work waiting for a person, read from the same list endpoints the pages use (`perPage=1` → `meta.total`).
 * A queue is only requested when the admin holds the permission that the API would require.
 */
const total = (promise) => promise.then((result) => result.meta.total).catch(() => null);
const kycTotal = (status) => kycService.getAdminKycApplications({ status, perPage: 1 }).then((payload) => normalizeAdminKycListResponse(payload).pagination.total).catch(() => null);

export async function loadQueues(can) {
  const jobs = {
    kycSubmitted: can(P.EXPERTS_REVIEW_KYC) && kycTotal('submitted'),
    kycReview: can(P.EXPERTS_REVIEW_KYC) && kycTotal('under_review'),
    renewals: can(P.EXPERT_RENEWALS_VIEW_ANY) && total(adminRenewals.list({ status: 'submitted', perPage: 1 })),
    renewalsReview: can(P.EXPERT_RENEWALS_VIEW_ANY) && total(adminRenewals.list({ status: 'under_review', perPage: 1 })),
    reviews: can(P.REVIEWS_VIEW_ANY) && total(adminOversight.reviews({ status: 'pending_moderation', perPage: 1 })),
    refunds: can(P.REFUNDS_VIEW) && total(adminFinance.refunds({ status: 'pending_review', perPage: 1 })),
    reconciliation: can(P.FINANCE_VIEW) && total(adminFinance.reconciliation({ status: 'open', perPage: 1 })),
    disputes: can(P.DISPUTES_VIEW) && total(adminFinance.disputes({ status: 'needs_response', perPage: 1 })),
    privacy: can(P.DATA_REQUESTS_VIEW_ANY) && total(adminOversight.dataRequests({ status: 'requested', perPage: 1 })),
    waiting: can(P.CATALOG_VIEW) && total(adminCatalog.waitingCases({ perPage: 1 })),
  };
  const entries = await Promise.all(Object.entries(jobs).map(async ([key, job]) => [key, job ? await job : null]));
  return Object.fromEntries(entries);
}

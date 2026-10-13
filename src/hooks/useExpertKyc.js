import { useCallback, useEffect, useState } from 'react';
import { getExpertKycStatus } from '../features/kyc/data/kycStore';
import { kycService } from '../services/kyc/kycService';

const DEFAULT_POLL_STATUSES = Object.freeze(['submitted', 'under_review']);

export default function useExpertKyc({
  enabled = true,
  refreshOnFocus = true,
  pollIntervalMs = 0,
  pollStatuses = DEFAULT_POLL_STATUSES,
} = {}) {
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return null;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const next = await kycService.getExpertKyc();
      setPayload(next);
      return next;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }
    refresh().catch(() => {});
    return undefined;
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !refreshOnFocus) return undefined;
    const onFocus = () => refresh({ silent: true }).catch(() => {});
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [enabled, refresh, refreshOnFocus]);

  useEffect(() => {
    if (!enabled || !pollIntervalMs || !payload) return undefined;
    const currentStatus = getExpertKycStatus(payload);
    if (!pollStatuses.includes(currentStatus)) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh({ silent: true }).catch(() => {});
      }
    }, pollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, payload, pollIntervalMs, pollStatuses, refresh]);

  return {
    payload,
    setPayload,
    status: payload ? getExpertKycStatus(payload) : null,
    isLoading,
    error,
    refresh,
  };
}

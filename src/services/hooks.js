import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/errorHandler.js';
import { newIdempotencyKey } from './idempotency.js';
import { useUserI18n } from '../features/userDashboard/i18n/UserI18nContext.jsx';

/**
 * Loads data from a service call and re-loads it when `deps` or the interface language change
 * (the API answers in the language sent in Accept-Language).
 *
 *   const { data, loading, error, reload } = useResource(() => casesService.list(), []);
 */
export function useResource(load, deps = [], { enabled = true } = {}) {
  const { language } = useUserI18n();
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const loadRef = useRef(load);
  loadRef.current = load;
  const seq = useRef(0);
  const run = useCallback(async ({ silent = false } = {}) => {
    const mine = ++seq.current;
    if (!silent) setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await loadRef.current();
      if (mine === seq.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (mine === seq.current) setState((current) => ({ data: silent ? current.data : null, loading: false, error }));
      return null;
    }
  }, []);
  useEffect(() => {
    if (!enabled) { setState({ data: null, loading: false, error: null }); return undefined; }
    run();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, language, enabled]);
  return { ...state, reload: run, errorMessage: state.error ? getErrorMessage(state.error) : '' };
}

/** Wraps a write call: `busy` while running, errors are returned instead of thrown so handlers stay short. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn) => {
    setBusy(true);
    try { return { ok: true, data: await fn() }; } catch (error) { return { ok: false, error, message: getErrorMessage(error) }; } finally { setBusy(false); }
  }, []);
  return { busy, run };
}

/**
 * One logical user intent = one Idempotency-Key. The key is kept across retries of the same intent
 * (network failure, double click) and only renewed after the call succeeds.
 */
export function useIdempotentAction(prefix = 'sv') {
  const keyRef = useRef(null);
  const { busy, run } = useAction();
  const exec = useCallback((fn) => run(async () => {
    if (!keyRef.current) keyRef.current = newIdempotencyKey(prefix);
    const result = await fn({ idempotencyKey: keyRef.current });
    keyRef.current = null;
    return result;
  }), [prefix, run]);
  return { busy, run: exec };
}

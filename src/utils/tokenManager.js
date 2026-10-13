const STORAGE_KEYS = Object.freeze({
  user: 'ecp-auth-user',
  expert: 'ecp-auth-expert',
  admin: 'ecp-auth-admin',
});

function assertAccountType(accountType) {
  if (!Object.prototype.hasOwnProperty.call(STORAGE_KEYS, accountType)) {
    throw new Error(`Unsupported account type: ${accountType}`);
  }
}

function getStorage(kind) {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function safeGet(storage, key) {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return Boolean(storage);
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function parseRecord(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value.token !== 'string' || !value.token) return null;
    return {
      token: value.token,
      tokenType: typeof value.tokenType === 'string' && value.tokenType ? value.tokenType : 'Bearer',
      scope: typeof value.scope === 'string' && value.scope ? value.scope : null,
      purpose: typeof value.purpose === 'string' && value.purpose ? value.purpose : 'session',
    };
  } catch {
    return null;
  }
}

export function getTokenRecord(accountType) {
  assertAccountType(accountType);
  const key = STORAGE_KEYS[accountType];

  const session = getStorage('session');
  const sessionRecord = parseRecord(safeGet(session, key));
  if (sessionRecord) return { ...sessionRecord, persistent: false };

  const local = getStorage('local');
  const localRecord = parseRecord(safeGet(local, key));
  if (localRecord) return { ...localRecord, persistent: true };

  return null;
}

export function getToken(accountType) {
  return getTokenRecord(accountType)?.token || null;
}

export function setToken(accountType, token, tokenType = 'Bearer', persistent = false, metadata = {}) {
  assertAccountType(accountType);
  if (!token) throw new Error('A token is required.');

  clearToken(accountType);

  const record = {
    token,
    tokenType,
    scope: typeof metadata.scope === 'string' && metadata.scope ? metadata.scope : null,
    purpose: typeof metadata.purpose === 'string' && metadata.purpose ? metadata.purpose : 'session',
  };
  const storage = getStorage(persistent ? 'local' : 'session');
  const stored = safeSet(storage, STORAGE_KEYS[accountType], JSON.stringify(record));
  if (!stored) throw new Error('Browser storage is unavailable; the authentication session could not be stored.');
}

export function clearToken(accountType) {
  assertAccountType(accountType);
  const key = STORAGE_KEYS[accountType];
  safeRemove(getStorage('session'), key);
  safeRemove(getStorage('local'), key);
}

export function hasToken(accountType) {
  return Boolean(getToken(accountType));
}

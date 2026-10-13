function configuredApiBaseUrl() {
  const viteValue = import.meta.env?.VITE_API_BASE_URL;
  const processValue = typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : '';
  return String(viteValue || processValue || '').replace(/\/+$/, '');
}

export function resolveAssetUrl(value) {
  const source = String(value || '').trim();
  if (!source || /^(blob:|data:|https?:\/\/)/i.test(source)) return source;

  const baseUrl = configuredApiBaseUrl();
  if (!baseUrl) return source;

  try {
    return new URL(source.replace(/^\/+/, ''), `${baseUrl}/`).toString();
  } catch {
    return source;
  }
}

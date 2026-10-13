export function resolveEmailVerificationCallback({
  id = '',
  hash = '',
  searchParams,
  rawQuery = '',
} = {}) {
  const verificationUrl = searchParams?.get('verification_url')?.trim() || '';
  const hasPathCallback = Boolean(id && hash);

  return {
    isCallback: Boolean(verificationUrl || hasPathCallback),
    request: {
      id,
      hash,
      rawQuery: verificationUrl ? '' : (hasPathCallback ? rawQuery : ''),
      verificationUrl,
    },
  };
}

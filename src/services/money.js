/** Money helpers. Everything is integer minor units; floats never carry business state. */

/** Splits `totalMinor` over milestone shares (percentages); the last part takes the remainder so the sum is exact. */
export function splitByShares(totalMinor, shares) {
  let used = 0;
  return shares.map((share, index) => {
    const part = index === shares.length - 1 ? totalMinor - used : Math.round((totalMinor * share) / 100);
    used += part;
    return part;
  });
}

export const sumMinor = (items, pick = (item) => item) => items.reduce((sum, item) => sum + (Number(pick(item)) || 0), 0);

/** Major units typed by a person ("4500.50") -> integer minor units, without floating point rounding surprises. */
export function toMinor(text, exponent = 2) {
  const clean = String(text ?? '').trim().replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const [whole, fraction = ''] = clean.split('.');
  if (fraction.length > exponent) return null;
  return Number(whole) * 10 ** exponent + Number(fraction.padEnd(exponent, '0') || 0);
}

export const fromMinor = (minor, exponent = 2) => {
  const value = Number(minor) || 0;
  const whole = Math.trunc(value / 10 ** exponent);
  const fraction = String(Math.abs(value % 10 ** exponent)).padStart(exponent, '0');
  return exponent ? `${whole}.${fraction}` : String(whole);
};

/** The API wants `YYYY-MM-DDTHH:mm:ssZ` instants (no milliseconds). */
export const toApiInstant = (value) => new Date(value).toISOString().replace(/\.\d{3}Z$/, 'Z');

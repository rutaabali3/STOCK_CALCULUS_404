/**
 * Parses a decimal string (e.g. "55.25") into an integer representation scaled by 10^dp.
 * For example:
 *   parseDecimal("55.25", 2) -> 5525
 *   parseDecimal("55", 3) -> 55000 (e.g. 55 kg -> 55000 grams)
 *   parseDecimal(".5", 3) -> 500
 *
 * Rejects:
 * - Empty strings
 * - Negative numbers
 * - Scientific notation ("1e3")
 * - More decimal places than maxDp
 * - NaN / non-digit characters (except single '.')
 * - Multiple decimal points
 */
export function parseDecimal(str: string, dp: number): number | null {
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Strict format: optional leading digits, optional dot, optional trailing digits
  // Disallows signs (+/-), exponent notation, whitespace inside
  if (!/^\d*(\.\d*)?$/.test(trimmed)) {
    return null;
  }

  // Must have at least one digit
  if (trimmed === '.') {
    return null;
  }

  const parts = trimmed.split('.');
  const wholeStr = parts[0] ?? '';
  const fracStr = parts[1] ?? '';

  if (fracStr.length > dp) {
    return null;
  }

  const whole = wholeStr === '' ? 0n : BigInt(wholeStr);
  const fracPadded = fracStr.padEnd(dp, '0');
  const frac = fracPadded === '' ? 0n : BigInt(fracPadded);

  const multiplier = 10n ** BigInt(dp);
  const total = whole * multiplier + frac;

  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(total);
}

/**
 * Formats an integer (scaled by 10^dp) into a clean decimal string.
 * Example:
 *   formatDecimal(55000, 3) -> "55"
 *   formatDecimal(55250, 3) -> "55.25"
 *   formatDecimal(55050, 3) -> "55.05"
 *   formatDecimal(501125, 2) -> "5011.25"
 */
export function formatDecimal(val: number, dp: number, trimZeros: boolean = true): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  const multiplier = 10 ** dp;
  const whole = Math.floor(absVal / multiplier);
  const frac = absVal % multiplier;

  if (dp === 0) {
    return `${isNegative ? '-' : ''}${whole}`;
  }

  const fracStr = frac.toString().padStart(dp, '0');

  if (trimZeros) {
    const trimmedFrac = fracStr.replace(/0+$/, '');
    if (trimmedFrac.length === 0) {
      return `${isNegative ? '-' : ''}${whole}`;
    }
    return `${isNegative ? '-' : ''}${whole}.${trimmedFrac}`;
  }

  return `${isNegative ? '-' : ''}${whole}.${fracStr}`;
}

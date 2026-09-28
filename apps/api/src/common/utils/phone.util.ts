import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Normalizes any phone number format (with/without '+', local with '0', national prefix, etc.)
 * into standardized E.164 format (+94762540292).
 *
 * @param raw Phone number in any string/number format
 * @param defaultCountry Default country code fallback (defaults to 'LK')
 * @returns E.164 formatted string (e.g. '+94762540292') or null if invalid
 */
export function normalizePhoneNumber(raw: any, defaultCountry: CountryCode = 'LK'): string | null {
  if (raw === undefined || raw === null) return null;

  // Convert to string, trim and strip internal spaces, hyphens, brackets, dots
  let str = String(raw).trim().replace(/[\s\-\(\)\.]/g, '');
  if (!str) return null;

  // Handle trailing .0 from Excel number parsing
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }

  // Case 1: Already has international '+' prefix
  if (str.startsWith('+')) {
    if (isValidPhoneNumber(str)) {
      try {
        return parsePhoneNumber(str).format('E.164');
      } catch {
        return null;
      }
    }
    return null;
  }

  // Case 2: International format using '00' prefix (e.g. 0094...)
  if (str.startsWith('00')) {
    const withPlus = '+' + str.slice(2);
    if (isValidPhoneNumber(withPlus)) {
      try {
        return parsePhoneNumber(withPlus).format('E.164');
      } catch {
        return null;
      }
    }
  }

  // Case 3: Missing '+' but has country calling code (e.g. 94762540292 or 14155552671)
  const withPlus = '+' + str;
  if (isValidPhoneNumber(withPlus)) {
    try {
      return parsePhoneNumber(withPlus).format('E.164');
    } catch {
      // continue to fallback
    }
  }

  // Case 4: Local/national format (e.g. 0762540292 or 762540292) with default country
  if (isValidPhoneNumber(str, defaultCountry)) {
    try {
      return parsePhoneNumber(str, defaultCountry).format('E.164');
    } catch {
      return null;
    }
  }

  return null;
}

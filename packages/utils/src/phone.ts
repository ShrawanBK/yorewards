/** E.164 phone helpers — Nepal (+977), Finland (+358), Australia (+61). */

export type CountryCode = "NP" | "FI" | "AU";

export const COUNTRY_DIAL_PREFIX: Record<CountryCode, string> = {
  NP: "+977",
  FI: "+358",
  AU: "+61",
};

const NP_PREFIX = COUNTRY_DIAL_PREFIX.NP;
const FI_PREFIX = COUNTRY_DIAL_PREFIX.FI;
const AU_PREFIX = COUNTRY_DIAL_PREFIX.AU;

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("977")) {
    return `+${digits}`;
  }

  if (digits.startsWith("358")) {
    return `+${digits}`;
  }

  if (digits.startsWith("61")) {
    return `+${digits}`;
  }

  // Finland trunk: 04… / 05…
  if (digits.startsWith("0") && /^0[4-5]\d{7,9}$/.test(digits)) {
    return `${FI_PREFIX}${digits.slice(1)}`;
  }

  // Australia trunk: 04XXXXXXXX
  if (/^04\d{8}$/.test(digits)) {
    return `${AU_PREFIX}${digits.slice(1)}`;
  }

  // Nepal 10-digit mobile starting with 9
  if (digits.length === 10 && digits.startsWith("9")) {
    return `${NP_PREFIX}${digits}`;
  }

  // Australia mobile without trunk: 4XXXXXXXX
  if (/^4\d{8}$/.test(digits)) {
    return `${AU_PREFIX}${digits}`;
  }

  return `+${digits}`;
}

export function detectCountry(phone: string): CountryCode {
  const normalised = normalisePhone(phone);
  if (normalised.startsWith(FI_PREFIX)) {
    return "FI";
  }
  if (normalised.startsWith(AU_PREFIX)) {
    return "AU";
  }
  return "NP";
}

/** Build E.164 from country + local digits (no country prefix in local). */
export function buildPhoneFromLocal(
  country: CountryCode,
  local: string,
): string {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("977") && country === "NP") {
    return `+${digits}`;
  }
  if (digits.startsWith("358") && country === "FI") {
    return `+${digits}`;
  }
  if (digits.startsWith("61") && country === "AU") {
    return `+${digits}`;
  }

  const national = digits.startsWith("0") ? digits.slice(1) : digits;
  return `${COUNTRY_DIAL_PREFIX[country]}${national}`;
}

export function isValidCustomerPhoneLocal(
  country: CountryCode,
  local: string,
): boolean {
  const raw = local.trim();
  if (!raw) return false;

  const digits = raw.replace(/\D/g, "");

  if (country === "NP") {
    return /^(977)?9[6-9]\d{8}$/.test(digits);
  }

  if (country === "AU") {
    // Mobile: 04XXXXXXXX, 4XXXXXXXX, or with country 614XXXXXXXX
    return /^(61)?0?4\d{8}$/.test(digits);
  }

  return /^(358)?[4-5]\d{7,9}$/.test(digits) || /^0[4-5]\d{7,9}$/.test(digits);
}

/** Mask E.164 phone for display — keeps prefix + last 4 digits. */
export function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return trimmed;

  const lastFour = trimmed.slice(-4);
  const prefix = trimmed.slice(0, Math.max(0, trimmed.length - 7));
  return `${prefix} *** ${lastFour}`;
}

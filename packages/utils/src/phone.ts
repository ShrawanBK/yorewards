/** E.164 phone helpers — Nepal (+977) and Finland (+358). */

export type CountryCode = "NP" | "FI";

const NP_PREFIX = "+977";
const FI_PREFIX = "+358";

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

  if (digits.startsWith("0") && digits.length >= 10) {
    return `${FI_PREFIX}${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("9")) {
    return `${NP_PREFIX}${digits}`;
  }

  return `+${digits}`;
}

export function detectCountry(phone: string): CountryCode {
  const normalised = normalisePhone(phone);
  if (normalised.startsWith(FI_PREFIX)) {
    return "FI";
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

  const national = digits.startsWith("0") ? digits.slice(1) : digits;
  return country === "FI" ? `${FI_PREFIX}${national}` : `${NP_PREFIX}${national}`;
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

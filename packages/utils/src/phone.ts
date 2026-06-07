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

import type { CountryCode } from "@repo/supabase/types";

export function isValidMerchantPhone(
  phone: string | undefined,
  country: CountryCode,
): boolean {
  const raw = (phone ?? "").trim();
  if (!raw) return true;

  const digits = raw.replace(/\D/g, "");

  if (country === "NP") {
    return /^(977)?9[6-9]\d{8}$/.test(digits);
  }

  if (country === "AU") {
    return /^(61)?0?4\d{8}$/.test(digits);
  }

  return /^(358)?[4-5]\d{7,9}$/.test(digits) || /^0[4-5]\d{7,9}$/.test(digits);
}

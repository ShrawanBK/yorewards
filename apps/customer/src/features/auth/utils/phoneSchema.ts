import {
  buildPhoneFromLocal,
  isValidCustomerPhoneLocal,
  normalisePhone,
  type CountryCode,
} from "@repo/utils/phone";

export function parseCustomerPhoneForm(
  country: string,
  local: string,
): { ok: true; phone: string } | { ok: false; reason: "missing" | "invalid" } {
  const trimmed = local.trim();
  if (!trimmed) return { ok: false, reason: "missing" };

  if (country !== "NP" && country !== "FI") {
    return { ok: false, reason: "invalid" };
  }

  const countryCode = country as CountryCode;
  if (!isValidCustomerPhoneLocal(countryCode, trimmed)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, phone: normalisePhone(buildPhoneFromLocal(countryCode, trimmed)) };
}

export function isValidCustomerPhone(raw: string): boolean {
  const phone = normalisePhone(raw.trim());
  if (phone.startsWith("+977")) {
    return isValidCustomerPhoneLocal("NP", phone.replace("+977", ""));
  }
  if (phone.startsWith("+358")) {
    return isValidCustomerPhoneLocal("FI", phone.replace("+358", ""));
  }
  return false;
}

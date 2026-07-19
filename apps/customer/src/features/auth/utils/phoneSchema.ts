import {
  buildPhoneFromLocal,
  isValidCustomerPhoneLocal,
  normalisePhone,
  type CountryCode,
} from "@repo/utils/phone";

const ALLOWED_COUNTRIES: CountryCode[] = ["NP", "FI", "AU"];

function isCountryCode(value: string): value is CountryCode {
  return ALLOWED_COUNTRIES.includes(value as CountryCode);
}

export function parseCustomerPhoneForm(
  country: string,
  local: string,
): { ok: true; phone: string } | { ok: false; reason: "missing" | "invalid" } {
  const trimmed = local.trim();
  if (!trimmed) return { ok: false, reason: "missing" };

  if (!isCountryCode(country)) {
    return { ok: false, reason: "invalid" };
  }

  if (!isValidCustomerPhoneLocal(country, trimmed)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, phone: normalisePhone(buildPhoneFromLocal(country, trimmed)) };
}

export function isValidCustomerPhone(raw: string): boolean {
  const phone = normalisePhone(raw.trim());
  if (phone.startsWith("+977")) {
    return isValidCustomerPhoneLocal("NP", phone.replace("+977", ""));
  }
  if (phone.startsWith("+358")) {
    return isValidCustomerPhoneLocal("FI", phone.replace("+358", ""));
  }
  if (phone.startsWith("+61")) {
    return isValidCustomerPhoneLocal("AU", phone.replace("+61", ""));
  }
  return false;
}

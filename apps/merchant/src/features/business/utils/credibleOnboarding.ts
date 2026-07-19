const URL_PATTERN =
  /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

export function isCredibleWebsiteOrSocial(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 4) return false;
  if (trimmed.startsWith("@")) return trimmed.length >= 4;
  return URL_PATTERN.test(trimmed);
}

export function meetsCredibleOnboardingCriteria(input: {
  registrationNumber: string;
  websiteUrl: string;
  businessAddress: string;
  phone: string | null;
}): boolean {
  return (
    input.registrationNumber.trim().length >= 3 &&
    input.businessAddress.trim().length >= 5 &&
    Boolean(input.phone?.trim()) &&
    isCredibleWebsiteOrSocial(input.websiteUrl)
  );
}

/** Setup checklist + onboarding gate — category plus credible business fields. */
export function isMerchantProfileComplete(merchant: {
  category: string | null;
  phone: string | null;
  registration_number: string | null;
  website_url: string | null;
  business_address: string | null;
}): boolean {
  return (
    Boolean(merchant.category?.trim()) &&
    meetsCredibleOnboardingCriteria({
      registrationNumber: merchant.registration_number ?? "",
      websiteUrl: merchant.website_url ?? "",
      businessAddress: merchant.business_address ?? "",
      phone: merchant.phone,
    })
  );
}

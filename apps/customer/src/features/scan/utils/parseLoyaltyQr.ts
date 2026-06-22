export type LoyaltyQrPayload = {
  merchantId: string;
  loyaltyCardId: string;
  locationId: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseLoyaltyQrText(text: string): LoyaltyQrPayload | null {
  const trimmed = text.trim();

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://app.yorewards.com");

    const merchantId = url.searchParams.get("m");
    const loyaltyCardId = url.searchParams.get("c");
    const locationId = url.searchParams.get("l");

    if (
      merchantId &&
      loyaltyCardId &&
      locationId &&
      isUuid(merchantId) &&
      isUuid(loyaltyCardId) &&
      isUuid(locationId)
    ) {
      return { merchantId, loyaltyCardId, locationId };
    }
  } catch {
    return null;
  }

  return null;
}

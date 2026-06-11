/**
 * Static loyalty card QR — customer scan opens app URL with card + branch.
 * Session token is created on scan (Day 5); QR is durable per counter.
 */
export function buildLoyaltyCardQrUrl({
  merchantId,
  loyaltyCardId,
  locationId,
  appBaseUrl,
}: {
  merchantId: string;
  loyaltyCardId: string;
  locationId: string;
  appBaseUrl: string;
}) {
  const base = appBaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    m: merchantId,
    c: loyaltyCardId,
    l: locationId,
  });
  return `${base}/scan?${params.toString()}`;
}

import { cookies } from "next/headers";

export const ACTIVE_MERCHANT_COOKIE = "yorewards_active_merchant_id";

export async function getActiveMerchantIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_MERCHANT_COOKIE)?.value ?? null;
}

export async function setActiveMerchantIdCookie(merchantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_MERCHANT_COOKIE, merchantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveMerchantIdCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_MERCHANT_COOKIE);
}

import { cookies } from "next/headers";

export const ACTIVE_LOCATION_COOKIE = "yorewards_active_location_id";

export async function getActiveLocationIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_LOCATION_COOKIE)?.value ?? null;
}

export async function setActiveLocationIdCookie(locationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_LOCATION_COOKIE, locationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveLocationIdCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_LOCATION_COOKIE);
}

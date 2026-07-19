import { cookies } from "next/headers";

export const ACTING_STAFF_COOKIE = "yorewards_acting_staff_id";

export async function getActingStaffUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTING_STAFF_COOKIE)?.value ?? null;
}

export async function setActingStaffUserIdCookie(staffUserId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTING_STAFF_COOKIE, staffUserId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearActingStaffUserIdCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTING_STAFF_COOKIE);
}

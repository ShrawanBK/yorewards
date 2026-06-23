import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { fail, type ActionFailure } from "@repo/utils/action-error";

type AdminAuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

export function isAdminUser(user: AdminAuthUser): boolean {
  if (user.app_metadata?.role === "admin") return true;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();
  if (adminEmail && userEmail && userEmail === adminEmail) return true;

  return false;
}

export async function requireAdminSession(): Promise<{ user: AdminAuthUser }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  if (!isAdminUser(user)) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/admin/login");
  }

  return { user };
}

type AdminActionGuard =
  | { ok: true; user: AdminAuthUser }
  | { ok: false; result: ActionFailure };

export async function requireAdminForAction(): Promise<AdminActionGuard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, result: fail("UNAUTHORIZED") };
  if (!isAdminUser(user)) return { ok: false, result: fail("FORBIDDEN") };

  return { ok: true, user };
}

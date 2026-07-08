import { createServiceRoleClient } from "../service-role";
import type { MerchantStaffRole, MerchantStaffStatus } from "../types";
import type { MerchantRow } from "./merchants";

export type MerchantStaffRow = {
  id: string;
  merchant_id: string;
  user_id: string | null;
  invited_email: string;
  display_name: string | null;
  role: MerchantStaffRole;
  status: MerchantStaffStatus;
  pin_hash: string | null;
  created_at: string;
  updated_at: string;
};

export const MERCHANT_ROLE_RANK: Record<MerchantStaffRole, number> = {
  cashier: 1,
  manager: 2,
  owner: 3,
};

export function roleMeetsMinimum(
  role: MerchantStaffRole,
  minimum: MerchantStaffRole,
): boolean {
  return MERCHANT_ROLE_RANK[role] >= MERCHANT_ROLE_RANK[minimum];
}

export async function getStaffMerchantsForUser(
  userId: string,
): Promise<MerchantRow[]> {
  const supabase = createServiceRoleClient();
  const { data: staffRows, error } = await supabase
    .from("merchant_staff")
    .select("merchant_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;
  const merchantIds = (staffRows ?? []).map((row) => row.merchant_id);
  if (merchantIds.length === 0) return [];

  const { data: merchants, error: merchantsError } = await supabase
    .from("merchants")
    .select("*")
    .in("id", merchantIds);

  if (merchantsError) throw merchantsError;
  return merchants ?? [];
}

export async function getMerchantRoleForUser(
  userId: string,
  merchantId: string,
): Promise<MerchantStaffRole | null> {
  const supabase = createServiceRoleClient();

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("user_id")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (!merchant) return null;
  if (merchant.user_id === userId) return "owner";

  const { data: staff, error: staffError } = await supabase
    .from("merchant_staff")
    .select("role")
    .eq("merchant_id", merchantId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (staffError) throw staffError;
  return staff?.role ?? null;
}

export async function listMerchantStaff(
  merchantId: string,
): Promise<MerchantStaffRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_staff")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MerchantStaffRow[];
}

export async function createOwnerStaffRow(input: {
  merchantId: string;
  userId: string;
  email: string;
  displayName?: string | null;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("merchant_staff").insert({
    merchant_id: input.merchantId,
    user_id: input.userId,
    invited_email: input.email.toLowerCase(),
    display_name: input.displayName ?? null,
    role: "owner",
    status: "active",
  });

  if (error) throw error;
}

export async function inviteMerchantStaff(input: {
  merchantId: string;
  email: string;
  role: Exclude<MerchantStaffRole, "owner">;
  displayName?: string | null;
}): Promise<MerchantStaffRow> {
  const supabase = createServiceRoleClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("merchant_staff")
    .insert({
      merchant_id: input.merchantId,
      invited_email: normalizedEmail,
      display_name: input.displayName?.trim() || null,
      role: input.role,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;

  const merchantUrl =
    process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:3001";

  try {
    await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${merchantUrl}/merchant/login`,
    });
  } catch {
    // Existing auth users link on next sign-in via invited_email match.
  }

  return data as MerchantStaffRow;
}

export async function linkPendingStaffInvites(
  userId: string,
  email: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase
    .from("merchant_staff")
    .update({
      user_id: userId,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("invited_email", normalizedEmail)
    .eq("status", "pending")
    .is("user_id", null);

  if (error) throw error;
}

export async function updateStaffPin(
  staffId: string,
  userId: string,
  pinHash: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("merchant_staff")
    .update({
      pin_hash: pinHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getStaffMemberByUserId(
  merchantId: string,
  staffUserId: string,
): Promise<MerchantStaffRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_staff")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("user_id", staffUserId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return (data as MerchantStaffRow | null) ?? null;
}

export async function removeStaffMember(staffId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("merchant_staff")
    .delete()
    .eq("id", staffId)
    .neq("role", "owner");

  if (error) throw error;
}

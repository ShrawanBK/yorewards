import { createServiceRoleClient } from "../service-role";
import type { Database, MerchantStatus } from "../types";

export type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
export type { MerchantStatus };

export async function getMerchantByUserId(userId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPendingMerchants() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

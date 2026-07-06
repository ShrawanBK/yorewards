import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode } from "../types";

export type StampDisputeStatus = "pending" | "approved" | "rejected";

export async function countCustomerDisputesThisMonth(
  customerId: string,
  merchantId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("stamp_disputes")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("merchant_id", merchantId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function createStampDispute(input: {
  customerId: string;
  customerCardId: string;
  merchantId: string;
  visitDate: string;
  amountClaimed: number;
  currencyCode: CurrencyCode;
  description: string;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_disputes")
    .insert({
      customer_id: input.customerId,
      customer_card_id: input.customerCardId,
      merchant_id: input.merchantId,
      visit_date: input.visitDate,
      amount_claimed: input.amountClaimed,
      currency_code: input.currencyCode,
      description: input.description.trim(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function countPendingDisputesForMerchant(
  merchantId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("stamp_disputes")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}

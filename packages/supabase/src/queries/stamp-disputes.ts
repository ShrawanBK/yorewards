import { createServiceRoleClient } from "../service-role";
import { createClient } from "../server";
import { notifyDisputeChange } from "../realtime/dispute-broadcast";
import {
  notifyDisputeFiled,
  notifyDisputeResolved,
} from "../notifications/dispatch";
import type { CurrencyCode } from "../types";

export {
  DISPUTE_MERCHANT_SLA_HOURS,
  getDisputeSlaHours,
  getDisputeSlaLevel,
  isWithinMerchantSlaWindow,
  needsEarlyAdminResolveConfirm,
  type CustomerStampDisputeItem,
  type DisputeSlaLevel,
  type StampDisputeFilter,
  type StampDisputeListItem,
  type StampDisputeStatus,
} from "./stamp-disputes-shared";

import {
  DISPUTE_MERCHANT_SLA_HOURS,
  type CustomerStampDisputeItem,
  type StampDisputeFilter,
  type StampDisputeListItem,
  type StampDisputeStatus,
} from "./stamp-disputes-shared";

type StampDisputeRow = {
  id: string;
  customer_id: string;
  customer_card_id: string;
  merchant_id: string;
  visit_date: string;
  amount_claimed: number;
  currency_code: string;
  description: string;
  status: string;
  merchant_response: string | null;
  created_at: string;
  resolved_at: string | null;
};

async function enrichDisputeRows(
  rows: StampDisputeRow[],
): Promise<StampDisputeListItem[]> {
  if (rows.length === 0) return [];

  const supabase = createServiceRoleClient();
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const merchantIds = [...new Set(rows.map((row) => row.merchant_id))];

  const [customersResult, merchantsResult] = await Promise.all([
    supabase.from("customers").select("id, name").in("id", customerIds),
    supabase.from("merchants").select("id, business_name").in("id", merchantIds),
  ]);

  if (customersResult.error) throw customersResult.error;
  if (merchantsResult.error) throw merchantsResult.error;

  const customerNames = new Map(
    (customersResult.data ?? []).map((row) => [row.id, row.name]),
  );
  const merchantNames = new Map(
    (merchantsResult.data ?? []).map((row) => [row.id, row.business_name]),
  );

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: customerNames.get(row.customer_id) ?? null,
    customerCardId: row.customer_card_id,
    merchantId: row.merchant_id,
    merchantName: merchantNames.get(row.merchant_id) ?? "—",
    visitDate: row.visit_date,
    amountClaimed: Number(row.amount_claimed),
    currencyCode: row.currency_code as CurrencyCode,
    description: row.description,
    status: row.status as StampDisputeStatus,
    merchantResponse: row.merchant_response,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

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

  void notifyDisputeChange({
    disputeId: data.id,
    merchantId: input.merchantId,
    customerCardId: input.customerCardId,
    status: "pending",
  });

  const [{ data: merchant }, { data: customer }] = await Promise.all([
    supabase.from("merchants").select("business_name").eq("id", input.merchantId).maybeSingle(),
    supabase.from("customers").select("name").eq("id", input.customerId).maybeSingle(),
  ]);

  try {
    await notifyDisputeFiled({
      id: data.id,
      merchantId: input.merchantId,
      merchantName: merchant?.business_name ?? "Merchant",
      customerName: customer?.name ?? null,
      amountClaimed: input.amountClaimed,
      currencyCode: input.currencyCode,
    });
  } catch (err) {
    console.error("[notifyDisputeFiled]", err);
  }

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

export async function countOpenDisputes(): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("stamp_disputes")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;
  return count ?? 0;
}

/** Pending disputes past the 48h merchant SLA — admin action expected. */
export async function countOverdueDisputes(): Promise<number> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(
    Date.now() - DISPUTE_MERCHANT_SLA_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count, error } = await supabase
    .from("stamp_disputes")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (error) throw error;
  return count ?? 0;
}

export async function getStampDisputeById(
  disputeId: string,
): Promise<StampDisputeListItem | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_disputes")
    .select("*")
    .eq("id", disputeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [item] = await enrichDisputeRows([data as StampDisputeRow]);
  return item ?? null;
}

function mapCustomerDisputeRows(
  rows: StampDisputeRow[],
  merchantNames: Map<string, string>,
): CustomerStampDisputeItem[] {
  return rows.map((row) => ({
    id: row.id,
    merchantId: row.merchant_id,
    merchantName: merchantNames.get(row.merchant_id) ?? "—",
    customerCardId: row.customer_card_id,
    visitDate: row.visit_date,
    amountClaimed: Number(row.amount_claimed),
    currencyCode: row.currency_code as CurrencyCode,
    description: row.description,
    status: row.status as StampDisputeStatus,
    merchantResponse: row.merchant_response,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

async function loadMerchantNames(
  merchantIds: string[],
): Promise<Map<string, string>> {
  if (merchantIds.length === 0) return new Map();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("id, business_name")
    .in("id", merchantIds);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row.business_name]));
}

const CUSTOMER_DISPUTE_COLUMNS =
  "id, merchant_id, customer_card_id, visit_date, amount_claimed, currency_code, description, status, merchant_response, created_at, resolved_at";

export async function listStampDisputesForCustomerCard(
  customerCardId: string,
): Promise<CustomerStampDisputeItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stamp_disputes")
    .select(CUSTOMER_DISPUTE_COLUMNS)
    .eq("customer_card_id", customerCardId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as StampDisputeRow[];
  const merchantNames = await loadMerchantNames([
    ...new Set(rows.map((row) => row.merchant_id)),
  ]);
  return mapCustomerDisputeRows(rows, merchantNames);
}

/** All disputes filed by this customer across merchants (RLS-scoped). */
export async function listStampDisputesForCustomer(
  customerId: string,
): Promise<CustomerStampDisputeItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stamp_disputes")
    .select(CUSTOMER_DISPUTE_COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as StampDisputeRow[];
  const merchantNames = await loadMerchantNames([
    ...new Set(rows.map((row) => row.merchant_id)),
  ]);
  return mapCustomerDisputeRows(rows, merchantNames);
}

export async function listStampDisputesForMerchant(
  merchantId: string,
  filter: StampDisputeFilter = "all",
): Promise<StampDisputeListItem[]> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("stamp_disputes")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("status", "pending");
  } else if (filter === "resolved") {
    query = query.in("status", ["approved", "rejected"]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return enrichDisputeRows((data ?? []) as StampDisputeRow[]);
}

export async function listStampDisputesForAdmin(
  filter: StampDisputeFilter = "pending",
): Promise<StampDisputeListItem[]> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("stamp_disputes")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("status", "pending");
  } else if (filter === "resolved") {
    query = query.in("status", ["approved", "rejected"]);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;

  return enrichDisputeRows((data ?? []) as StampDisputeRow[]);
}

export async function listPendingDisputesForCustomerCard(
  customerCardId: string,
): Promise<StampDisputeListItem[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_disputes")
    .select("*")
    .eq("customer_card_id", customerCardId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return enrichDisputeRows((data ?? []) as StampDisputeRow[]);
}

export async function resolveStampDispute(input: {
  disputeId: string;
  status: Exclude<StampDisputeStatus, "pending">;
  merchantResponse?: string | null;
}): Promise<StampDisputeListItem> {
  const sessionId = await resolveStampDisputeAtomic({
    disputeId: input.disputeId,
    status: input.status,
    response: input.merchantResponse,
    issueStamp: false,
  });
  void sessionId;
  const item = await getStampDisputeById(input.disputeId);
  if (!item) throw new Error("DISPUTE_NOT_FOUND");
  return item;
}

function mapDisputeRpcError(message: string): never {
  if (message.includes("DISPUTE_ALREADY_RESOLVED")) {
    throw new Error("DISPUTE_ALREADY_RESOLVED");
  }
  if (message.includes("DISPUTE_NOT_FOUND")) {
    throw new Error("DISPUTE_NOT_FOUND");
  }
  throw new Error(message);
}

/** Atomically resolve a pending dispute; optionally issue exactly one stamp when approved. */
export async function resolveStampDisputeAtomic(input: {
  disputeId: string;
  status: Exclude<StampDisputeStatus, "pending">;
  response?: string | null;
  issueStamp?: boolean;
}): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("resolve_stamp_dispute", {
    p_dispute_id: input.disputeId,
    p_status: input.status,
    p_response: input.response?.trim() || null,
    p_issue_stamp: input.issueStamp ?? false,
  });

  if (error) {
    mapDisputeRpcError(error.message);
  }

  const dispute = await getStampDisputeById(input.disputeId);
  if (dispute) {
    void notifyDisputeChange({
      disputeId: dispute.id,
      merchantId: dispute.merchantId,
      customerCardId: dispute.customerCardId,
      status: dispute.status,
    });
    // Await so serverless/server-action teardown cannot drop the insert.
    try {
      await notifyDisputeResolved(dispute);
    } catch (err) {
      console.error("[notifyDisputeResolved]", err);
    }
  }

  return data ?? null;
}

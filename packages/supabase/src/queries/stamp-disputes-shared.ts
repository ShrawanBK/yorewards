import type { CurrencyCode } from "../types";

export type StampDisputeStatus = "pending" | "approved" | "rejected";

export type StampDisputeListItem = {
  id: string;
  customerId: string;
  customerName: string | null;
  customerCardId: string;
  merchantId: string;
  merchantName: string;
  visitDate: string;
  amountClaimed: number;
  currencyCode: CurrencyCode;
  description: string;
  status: StampDisputeStatus;
  merchantResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type StampDisputeFilter = "pending" | "resolved" | "all";

export type CustomerStampDisputeItem = {
  id: string;
  merchantId: string;
  merchantName: string;
  customerCardId: string;
  visitDate: string;
  amountClaimed: number;
  currencyCode: CurrencyCode;
  description: string;
  status: StampDisputeStatus;
  merchantResponse: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

/** Merchant must respond within this window before admin escalation (PRD §3.8). */
export const DISPUTE_MERCHANT_SLA_HOURS = 48;

export function getDisputeSlaHours(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
}

export function isWithinMerchantSlaWindow(createdAt: string): boolean {
  return getDisputeSlaHours(createdAt) < DISPUTE_MERCHANT_SLA_HOURS;
}

/** Pending dispute still inside the merchant's 48h response window. */
export function needsEarlyAdminResolveConfirm(
  status: StampDisputeStatus,
  createdAt: string,
): boolean {
  return status === "pending" && isWithinMerchantSlaWindow(createdAt);
}

export type DisputeSlaLevel = "on_track" | "due" | "overdue";

export function getDisputeSlaLevel(
  status: StampDisputeStatus,
  createdAt: string,
): DisputeSlaLevel | null {
  if (status !== "pending") return null;
  const hours = getDisputeSlaHours(createdAt);
  if (hours >= 48) return "overdue";
  if (hours >= 24) return "due";
  return "on_track";
}

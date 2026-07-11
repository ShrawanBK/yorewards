export type SubscriptionTier = "free" | "starter" | "growth" | "enterprise";

export type PlanLimits = {
  maxActiveCustomers: number | null;
  maxLoyaltyCards: number | null;
  maxStaff: number | null;
  crm: boolean;
  csvExport: boolean;
  campaigns: boolean;
  smartPromo: boolean;
  verifiedBadge: boolean;
  advancedAnalytics: boolean;
  pushCampaignsPerMonth: number | null;
};

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    maxActiveCustomers: 50,
    maxLoyaltyCards: 1,
    maxStaff: 1,
    crm: false,
    csvExport: false,
    campaigns: false,
    smartPromo: false,
    verifiedBadge: false,
    advancedAnalytics: false,
    pushCampaignsPerMonth: 0,
  },
  starter: {
    maxActiveCustomers: null,
    maxLoyaltyCards: 3,
    maxStaff: 3,
    crm: true,
    csvExport: true,
    campaigns: true,
    smartPromo: true,
    verifiedBadge: true,
    advancedAnalytics: true,
    pushCampaignsPerMonth: 0,
  },
  growth: {
    maxActiveCustomers: null,
    maxLoyaltyCards: null,
    maxStaff: 10,
    crm: true,
    csvExport: true,
    campaigns: true,
    smartPromo: true,
    verifiedBadge: true,
    advancedAnalytics: true,
    pushCampaignsPerMonth: 4,
  },
  enterprise: {
    maxActiveCustomers: null,
    maxLoyaltyCards: null,
    maxStaff: null,
    crm: true,
    csvExport: true,
    campaigns: true,
    smartPromo: true,
    verifiedBadge: true,
    advancedAnalytics: true,
    pushCampaignsPerMonth: null,
  },
};

export const PLAN_PRICES_NPR: Record<
  Exclude<SubscriptionTier, "free" | "enterprise">,
  number
> = {
  starter: 999,
  growth: 2499,
};

export const TRIAL_DAYS = 30;

export function normalizeSubscriptionTier(
  tier: string | null | undefined,
): SubscriptionTier {
  if (
    tier === "starter" ||
    tier === "growth" ||
    tier === "enterprise" ||
    tier === "free"
  ) {
    return tier;
  }
  return "free";
}

export function getPlanLimits(
  tier: string | null | undefined,
): PlanLimits {
  return PLAN_LIMITS[normalizeSubscriptionTier(tier)];
}

export function merchantCanUseCrm(tier: string | null | undefined): boolean {
  return getPlanLimits(tier).crm;
}

export function merchantCanExportCsv(tier: string | null | undefined): boolean {
  return getPlanLimits(tier).csvExport;
}

export function merchantCanUseCampaigns(
  tier: string | null | undefined,
): boolean {
  return getPlanLimits(tier).campaigns;
}

export function merchantCanUseSmartPromo(
  tier: string | null | undefined,
): boolean {
  return getPlanLimits(tier).smartPromo;
}

export function merchantCanUseVerifiedBadge(
  tier: string | null | undefined,
): boolean {
  return getPlanLimits(tier).verifiedBadge;
}

export function isWithinLimit(
  current: number,
  max: number | null,
): boolean {
  if (max === null) return true;
  return current < max;
}

export function assertWithinLimit(
  current: number,
  max: number | null,
  resource: "customers" | "cards" | "staff",
): { ok: true } | { ok: false; resource: typeof resource; limit: number } {
  if (isWithinLimit(current, max)) return { ok: true };
  return { ok: false, resource, limit: max! };
}

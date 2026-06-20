"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { MerchantCustomerRow } from "@repo/supabase/queries/merchant-customers";

function rewardStatusLabel(
  t: ReturnType<typeof useTranslations<"customers">>,
  status: MerchantCustomerRow["rewardStatus"],
) {
  return t(`rewardStatus.${status}`);
}

export function MerchantCustomersView({
  customers,
  locations,
}: {
  customers: MerchantCustomerRow[];
  locations: MerchantLocationRow[];
}) {
  const t = useTranslations("customers");
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeBranch = searchParams.get("branch") ?? "all";

  function handleBranchChange(branchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", branchId);
    }
    const query = params.toString();
    router.replace(
      query ? `/merchant/customers?${query}` : "/merchant/customers",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="branch-filter" className="text-sm font-medium">
          {t("branchFilter")}
        </label>
        <select
          id="branch-filter"
          value={activeBranch}
          onChange={(event) => handleBranchChange(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">{t("allBranches")}</option>
          {locations
            .filter((location) => location.is_active)
            .map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
        </select>
        <p className="merchant-body-muted text-sm">{t("branchFilterHint")}</p>
      </div>

      {customers.length === 0 ? (
        <Card className="merchant-glass-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="merchant-body-muted max-w-md text-sm">
              {t("emptyDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                <th className="px-4 py-3 font-medium">{t("table.progress")}</th>
                <th className="px-4 py-3 font-medium">{t("table.cycle")}</th>
                <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                <th className="px-4 py-3 font-medium">
                  {t("table.lastBranch")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("table.lastVisit")}
                </th>
                <th className="px-4 py-3 font-medium">
                  {t("table.totalStamps")}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const displayName =
                  customer.customerName?.split(" ")[0] ?? t("unknownCustomer");
                return (
                  <tr
                    key={customer.customerCardId}
                    className="border-b border-border/70"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {t("progress", {
                        current: customer.currentStamps,
                        target: customer.stampTarget,
                      })}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {customer.cycleNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {rewardStatusLabel(t, customer.rewardStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {customer.lastBranchName ?? t("unknownBranch")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.lastStampedAt
                        ? format.relativeTime(
                            new Date(customer.lastStampedAt),
                            Date.now(),
                          )
                        : t("never")}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {customer.totalStampsEver}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

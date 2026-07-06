"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Download, Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { MerchantCustomerRow } from "@repo/supabase/queries/merchant-customers";
import type { SubscriptionTier } from "@repo/supabase/types";
import { CustomerDetailDrawer } from "@/features/customers/components/CustomerDetailDrawer";
import { formatSpend } from "@/features/customers/utils/format";
import { merchantCanExportCsv } from "@repo/supabase/queries/merchant-customers";

type SortKey = "spend" | "visits" | "lastVisit";

function rewardStatusLabel(
  t: ReturnType<typeof useTranslations<"customers">>,
  status: MerchantCustomerRow["rewardStatus"],
) {
  return t(`rewardStatus.${status}`);
}

const SEGMENT_CLASS: Record<MerchantCustomerRow["segment"], string> = {
  vip: "border-amber-500/55 bg-amber-950/45 text-amber-100",
  regular: "border-border bg-muted text-foreground",
  at_risk: "border-orange-500/55 bg-orange-950/40 text-orange-100",
  new: "border-sky-500/55 bg-sky-950/40 text-sky-100",
  lapsed: "border-border bg-muted/60 text-muted-foreground",
};

export function MerchantCustomersView({
  merchantId,
  subscriptionTier,
  customers,
  locations,
}: {
  merchantId: string;
  subscriptionTier: SubscriptionTier;
  customers: MerchantCustomerRow[];
  locations: MerchantLocationRow[];
}) {
  const t = useTranslations("customers");
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeBranch = searchParams.get("branch") ?? "all";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastVisit");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const canExport = merchantCanExportCsv(subscriptionTier);

  function handleBranchChange(branchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", branchId);
    }
    const queryString = params.toString();
    router.replace(
      queryString ? `/merchant/customers?${queryString}` : "/merchant/customers",
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = customers;
    if (q) {
      list = list.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(q) ||
          c.phone.includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "spend") return b.totalSpend - a.totalSpend;
      if (sort === "visits") return b.visitCount - a.visitCount;
      const at = a.lastStampedAt ? new Date(a.lastStampedAt).getTime() : 0;
      const bt = b.lastStampedAt ? new Date(b.lastStampedAt).getTime() : 0;
      return bt - at;
    });
  }, [customers, query, sort]);

  const exportHref = `/api/customers/export${
    activeBranch !== "all" ? `?branch=${activeBranch}` : ""
  }`;

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="min-h-11 flex-1"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label={t("sortAria")}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="spend">{t("sort.spend")}</option>
          <option value="visits">{t("sort.visits")}</option>
          <option value="lastVisit">{t("sort.lastVisit")}</option>
        </select>
        {canExport ? (
          <Button asChild variant="outline" className="min-h-11">
            <a href={exportHref} download>
              <Download className="mr-2 size-4" aria-hidden />
              {t("exportCsv")}
            </a>
          </Button>
        ) : (
          <p className="merchant-body-muted text-sm">{t("exportStarterOnly")}</p>
        )}
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
      ) : filtered.length === 0 ? (
        <p className="merchant-body-muted text-sm">{t("noResults")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                <th className="px-4 py-3 font-medium">{t("table.segment")}</th>
                <th className="px-4 py-3 font-medium">{t("table.spend")}</th>
                <th className="px-4 py-3 font-medium">{t("table.visits")}</th>
                <th className="px-4 py-3 font-medium">{t("table.progress")}</th>
                <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                <th className="px-4 py-3 font-medium">{t("table.lastVisit")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const displayName =
                  customer.customerName?.split(" ")[0] ?? t("unknownCustomer");
                return (
                  <tr
                    key={customer.customerCardId}
                    className="cursor-pointer border-b border-border/70 hover:bg-muted/30"
                    onClick={() => setSelectedCustomerId(customer.customerId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCustomerId(customer.customerId);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={t("openProfile", { name: displayName })}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={SEGMENT_CLASS[customer.segment]}
                      >
                        {t(`segments.${customer.segment}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatSpend(customer.totalSpend, customer.currency)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{customer.visitCount}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {t("progress", {
                        current: customer.currentStamps,
                        target: customer.stampTarget,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {rewardStatusLabel(t, customer.rewardStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.lastStampedAt
                        ? format.relativeTime(
                            new Date(customer.lastStampedAt),
                            Date.now(),
                          )
                        : t("never")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CustomerDetailDrawer
        merchantId={merchantId}
        customerId={selectedCustomerId}
        open={selectedCustomerId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomerId(null);
        }}
      />
    </div>
  );
}

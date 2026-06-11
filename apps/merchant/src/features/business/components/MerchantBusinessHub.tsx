"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { LoyaltyCardRow } from "@repo/supabase/queries/loyalty-cards";
import type { MerchantStatus } from "@repo/supabase/types";
import { Check, MapPin } from "lucide-react";
import { switchActiveMerchantAction } from "@/features/business/api/businessActions";
import { MerchantBusinessDetailCard } from "@/features/business/components/MerchantBusinessDetailCard";
import { BranchList } from "@/features/business/components/BranchList";

type FilterValue = "all" | "active" | "inactive";

const STATUS_BADGE: Record<
  MerchantStatus,
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    className?: string;
  }
> = {
  pending: { variant: "secondary" },
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "outline" },
  rejected: { variant: "destructive" },
};

function isActiveStatus(status: MerchantStatus) {
  return status === "active";
}

function businessInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function MerchantBusinessHub({
  merchants,
  activeMerchantId,
  branchCounts,
  locations,
  loyaltyCard,
}: {
  merchants: MerchantRow[];
  activeMerchantId: string;
  branchCounts: Record<string, number>;
  locations: MerchantLocationRow[];
  loyaltyCard: LoyaltyCardRow | null;
}) {
  const t = useTranslations("business");
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [detailTab, setDetailTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const merchant of merchants) {
      if (isActiveStatus(merchant.status)) active += 1;
      else inactive += 1;
    }
    return { all: merchants.length, active, inactive };
  }, [merchants]);

  const filtered = useMemo(() => {
    if (filter === "active") {
      return merchants.filter((m) => isActiveStatus(m.status));
    }
    if (filter === "inactive") {
      return merchants.filter((m) => !isActiveStatus(m.status));
    }
    return merchants;
  }, [merchants, filter]);

  const activeMerchant = useMemo(
    () => merchants.find((m) => m.id === activeMerchantId),
    [merchants, activeMerchantId],
  );

  const selectBusiness = useCallback(
    (merchantId: string) => {
      if (merchantId === activeMerchantId || isPending) return;
      startTransition(async () => {
        const result = await switchActiveMerchantAction(merchantId);
        if (!result?.error) router.refresh();
      });
    },
    [activeMerchantId, isPending, router],
  );

  return (
    <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
      <Card className="lg:sticky lg:top-28">
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{t("listTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("listSubtitle")}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/merchant/add-business">{t("addAnother")}</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterValue)}
          >
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">
                {t("filters.all")} ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="active">
                {t("filters.active")} ({counts.active})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                {t("filters.inactive")} ({counts.inactive})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <p className="font-medium">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {filtered.map((merchant) => {
                const isSelected = merchant.id === activeMerchantId;
                const badge = STATUS_BADGE[merchant.status];
                const branches = branchCounts[merchant.id] ?? 0;

                return (
                  <li key={merchant.id}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => selectBusiness(merchant.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        "hover:border-brand-purple/40 hover:bg-brand-surface/60",
                        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        "disabled:pointer-events-none disabled:opacity-60",
                        isSelected &&
                          "border-brand-purple bg-brand-surface ring-1 ring-brand-purple/30",
                      )}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                        style={{
                          backgroundColor: merchant.primary_color,
                        }}
                        aria-hidden
                      >
                        {merchant.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={merchant.logo_url}
                            alt=""
                            className="size-10 rounded-lg object-cover"
                          />
                        ) : (
                          businessInitial(merchant.business_name)
                        )}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {merchant.business_name}
                          </span>
                          {isSelected ? (
                            <Badge
                              variant="outline"
                              className="border-brand-purple text-brand-purple"
                            >
                              <Check className="mr-1 size-3" aria-hidden />
                              {t("selected")}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {merchant.category} ·{" "}
                          {t(`countries.${merchant.country}`)}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" aria-hidden />
                          {t("branchCount", { count: branches })}
                        </p>
                      </div>
                      <Badge
                        variant={badge.variant}
                        className={cn("shrink-0 capitalize", badge.className)}
                      >
                        {t(`status.${merchant.status}`)}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {activeMerchant ? (
          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList>
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="branches">{t("tabs.branches")}</TabsTrigger>
              <TabsTrigger value="loyaltyCard">{t("tabs.loyaltyCard")}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <MerchantBusinessDetailCard merchant={activeMerchant} />
            </TabsContent>
            <TabsContent value="branches" className="mt-4">
              <BranchList
                merchantId={activeMerchant.id}
                locations={locations}
              />
            </TabsContent>
            <TabsContent value="loyaltyCard" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("loyaltyCardSummary.title")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("loyaltyCardSummary.subtitle")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loyaltyCard ? (
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">
                          {t("loyaltyCardSummary.cardName")}
                        </dt>
                        <dd className="font-medium">{loyaltyCard.card_name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {t("loyaltyCardSummary.stampTarget")}
                        </dt>
                        <dd className="font-medium">
                          {loyaltyCard.stamp_target}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("loyaltyCardSummary.notConfigured")}
                    </p>
                  )}
                  <Button asChild>
                    <Link href="/merchant/loyalty-card">
                      {t("loyaltyCardSummary.configure")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}

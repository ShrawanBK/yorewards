"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Banknote, Gift, Stamp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { ActivityFeedItem } from "@repo/supabase/queries/analytics";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import {
  useMerchantAnalytics,
  type AnalyticsPeriod,
} from "@/features/analytics/api/analyticsQueries";
import { SpendWeekChart } from "@/features/analytics/components/SpendWeekChart";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";
import { formatSpend } from "@/features/customers/utils/format";

const PERIODS: AnalyticsPeriod[] = ["today", "week", "month"];

export function MerchantAnalyticsView({
  merchantId,
  locations,
  initialData,
}: {
  merchantId: string;
  locations: MerchantLocationRow[];
  initialData: MerchantAnalyticsPayload;
}) {
  const t = useTranslations("analytics");
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeBranch = searchParams.get("branch") ?? "all";
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const { data } = useMerchantAnalytics(merchantId, activeBranch, initialData);
  const summary = data?.summary ?? initialData.summary;
  const activity = data?.activity ?? initialData.activity;
  const spend = data?.spend ?? initialData.spend;

  function handleBranchChange(branchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId === "all") {
      params.delete("branch");
    } else {
      params.set("branch", branchId);
    }
    const query = params.toString();
    router.replace(
      query ? `/merchant/analytics?${query}` : "/merchant/analytics",
    );
  }

  const statCards = [
    {
      key: "collectors",
      icon: Users,
      label: t("stats.collectors"),
      value: summary.activeCollectors,
      hint: t("stats.collectorsHint"),
    },
    {
      key: "stamps",
      icon: Stamp,
      label: t("stats.stamps"),
      value: summary.stampsIssued[period],
      hint: t(`stats.period.${period}`),
    },
    {
      key: "redeemed",
      icon: Gift,
      label: t("stats.redeemed"),
      value: summary.rewardsRedeemed[period],
      hint: t(`stats.period.${period}`),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="analytics-branch-filter" className="text-sm font-medium">
          {t("branchFilter")}
        </label>
        <select
          id="analytics-branch-filter"
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

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={period === p}
          >
            {t(`stats.period.${p}`)}
          </button>
        ))}
      </div>

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={t("stats.regionLabel")}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="merchant-glass-card">
              <CardHeader className="gap-1.5">
                <CardDescription className="merchant-stat-label flex items-center gap-2">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="merchant-body-muted text-sm">{stat.hint}</p>
              </CardContent>
            </Card>
          );
        })}

        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription className="merchant-stat-label">
              {t("stats.redemptionRate")}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {summary.redemptionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="merchant-body-muted text-sm">{t("stats.rateHint")}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="spend-heading">
        <h2 id="spend-heading" className="text-lg font-semibold">
          {t("spend.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="merchant-glass-card">
            <CardHeader className="gap-1.5">
              <CardDescription className="merchant-stat-label flex items-center gap-2">
                <Banknote className="size-4 shrink-0" aria-hidden />
                {t("spend.revenue")}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {formatSpend(spend.loyaltyRevenue, spend.currency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="merchant-glass-card">
            <CardHeader className="gap-1.5">
              <CardDescription className="merchant-stat-label">
                {t("spend.avgVisit")}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {formatSpend(spend.avgSpendPerVisit, spend.currency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="merchant-glass-card">
            <CardHeader className="gap-1.5">
              <CardDescription className="merchant-stat-label">
                {t("spend.visitCount")}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {spend.visitCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription>{t("spend.weekTrend")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {spend.visitCount === 0 ? (
              <p className="merchant-body-muted text-sm">{t("spend.empty")}</p>
            ) : spend.weeklyTrend.every((day) => day.total === 0) ? (
              <>
                <p className="merchant-body-muted text-sm">{t("spend.weekEmpty")}</p>
                <SpendWeekChart
                  data={spend.weeklyTrend}
                  currency={spend.currency}
                  ariaLabel={t("spend.weekChartAria")}
                />
              </>
            ) : (
              <SpendWeekChart
                data={spend.weeklyTrend}
                currency={spend.currency}
                ariaLabel={t("spend.weekChartAria")}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-semibold">
          {t("activity.title")}
        </h2>
        {activity.length === 0 ? (
          <Card className="merchant-glass-card">
            <CardContent className="py-8 text-center">
              <p className="merchant-body-muted">{t("activity.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {activity.map((item: ActivityFeedItem) => (
              <li
                key={item.id}
                className="merchant-glass-card flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`activity.types.${item.type}`)}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-muted-foreground"
                  dateTime={item.occurredAt}
                >
                  {format.relativeTime(new Date(item.occurredAt), Date.now())}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

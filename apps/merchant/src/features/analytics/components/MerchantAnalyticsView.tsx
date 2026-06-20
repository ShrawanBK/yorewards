"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Gift, Stamp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { ActivityFeedItem } from "@repo/supabase/queries/analytics";
import {
  useMerchantAnalytics,
  type AnalyticsPeriod,
} from "@/features/analytics/api/analyticsQueries";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";

const PERIODS: AnalyticsPeriod[] = ["today", "week", "month"];

export function MerchantAnalyticsView({
  merchantId,
  initialData,
}: {
  merchantId: string;
  initialData: MerchantAnalyticsPayload;
}) {
  const t = useTranslations("analytics");
  const format = useFormatter();
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const { data } = useMerchantAnalytics(merchantId, initialData);
  const summary = data?.summary ?? initialData.summary;
  const activity = data?.activity ?? initialData.activity;

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

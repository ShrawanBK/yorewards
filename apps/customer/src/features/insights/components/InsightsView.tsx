"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { useAuthStore } from "@/features/auth";
import {
  fetchCustomerInsightsAction,
  fetchSpendingHistoryAction,
} from "@/features/insights/api/insightsActions";
import { DailySpendingChart } from "@/features/insights/components/DailySpendingChart";
import { MerchantSpendChart } from "@/features/insights/components/MerchantSpendChart";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

function formatAmount(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

export function InsightsView() {
  const t = useTranslations("insights");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();
  const customerId = useAuthStore((s) => s.customerId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [merchantFilter, setMerchantFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");

  const {
    data: insights,
    isLoading: insightsLoading,
    isError: insightsError,
    error: insightsErr,
  } = useQuery({
    queryKey: ["customer-insights", customerId, year, month],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const result = await fetchCustomerInsightsAction(year, month);
      if (isActionFailure(result)) throw new Error(result.error.code);
      return result.insights;
    },
  });

  const monthRange = useMemo(() => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return {
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
    };
  }, [year, month]);

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
  } = useQuery({
    queryKey: [
      "spending-history",
      customerId,
      year,
      month,
      merchantFilter,
      minAmount,
    ],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const result = await fetchSpendingHistoryAction({
        merchantId: merchantFilter || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
        fromDate: monthRange.fromDate,
        toDate: monthRange.toDate,
      });
      if (isActionFailure(result)) throw new Error(result.error.code);
      return result.items;
    },
  });

  const monthLabel = useMemo(
    () => format.dateTime(new Date(year, month - 1, 1), { month: "long", year: "numeric" }),
    [format, month, year],
  );

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const merchantOptions = insights?.merchantBreakdown ?? [];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6 pb-8">
      <Button variant="ghost" className="min-h-11 w-fit justify-start px-0" asChild>
        <Link href="/wallet">
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {t("back")}
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          onClick={() => shiftMonth(-1)}
          aria-label={t("prevMonth")}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <p className="text-sm font-medium">{monthLabel}</p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          onClick={() => shiftMonth(1)}
          aria-label={t("nextMonth")}
          disabled={year === now.getFullYear() && month === now.getMonth() + 1}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {insightsLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : insightsError ? (
        <p className="text-sm text-destructive" role="alert">
          {resolveActionError(tErrors, {
            code: (insightsErr as Error).message as "INSIGHTS_LOAD_FAILED",
          })}
        </p>
      ) : insights ? (
        <section className="space-y-4 rounded-xl border border-border p-4" aria-labelledby="monthly-heading">
          <h2 id="monthly-heading" className="text-lg font-semibold">
            {t("monthlyTotal")}
          </h2>
          {insights.currencyTotals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noSpend")}</p>
          ) : (
            <ul className="space-y-3">
              {insights.currencyTotals.map((row) => {
                const delta = row.total - row.lastMonthTotal;
                const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;
                return (
                  <li key={row.currency} className="space-y-1">
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatAmount(row.total, row.currency)}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <TrendIcon className="size-4 shrink-0" aria-hidden />
                      {t("vsLastMonth", {
                        amount: formatAmount(Math.abs(delta), row.currency),
                        direction: delta >= 0 ? t("more") : t("less"),
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            {t("stampsThisMonth", { count: insights.stampsThisMonth })}
          </p>

          {insights.merchantBreakdown.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("byMerchant")}</h3>
              <MerchantSpendChart
                data={insights.merchantBreakdown}
                ariaLabel={t("chartAria")}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-lg font-semibold">
          {t("historyTitle")}
        </h2>
        <div className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="merchant-filter">
            {t("filterMerchant")}
          </label>
          <select
            id="merchant-filter"
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="h-11 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">{t("allMerchants")}</option>
            {merchantOptions.map((m) => (
              <option key={m.merchantId} value={m.merchantId}>
                {m.businessName}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder={t("minAmountPlaceholder")}
            aria-label={t("minAmountAria")}
            className="min-h-11"
          />
        </div>

        {historyLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : historyError ? (
          <p className="text-sm text-destructive" role="alert">
            {resolveActionError(tErrors, {
              code: (historyErr as Error).message as "INSIGHTS_LOAD_FAILED",
            })}
          </p>
        ) : history?.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
        ) : (
          <>
            <div className="space-y-2 rounded-xl border border-border p-4">
              <h3 className="text-sm font-medium">{t("dailyTrend")}</h3>
              <DailySpendingChart
                items={history ?? []}
                year={year}
                month={month}
                merchantFilter={merchantFilter || undefined}
                ariaLabel={t("dailyTrendAria")}
              />
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border">
            {history?.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.businessName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.branchName ?? t("unknownBranch")}
                    {" · "}
                    <time dateTime={item.stampedAt}>
                      {format.dateTime(new Date(item.stampedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">
                  {formatAmount(item.amountSpent, item.currency)}
                </p>
              </li>
            ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

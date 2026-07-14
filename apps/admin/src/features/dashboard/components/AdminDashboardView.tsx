"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Gift,
  MessageSquare,
  Stamp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { PlatformDashboardData } from "@/features/dashboard/api/getPlatformDashboardData";
import type { PlatformActivityItem, PlatformStatsPeriod } from "@repo/supabase/queries/platform";

const PERIODS: PlatformStatsPeriod[] = ["today", "week", "month"];

function ActivityRow({ item }: { item: PlatformActivityItem }) {
  const tActions = useTranslations("audit.actions");
  const format = useFormatter();

  let label = item.action;
  try {
    label = tActions(item.action);
  } catch {
    // Unknown action — show raw code until i18n key is added
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
      <div className="space-y-0.5">
        <p className="font-medium">{label}</p>
        {item.notes ? (
          <p className="text-muted-foreground">{item.notes}</p>
        ) : null}
      </div>
      <time
        className="shrink-0 text-xs text-muted-foreground"
        dateTime={item.occurredAt}
      >
        {format.dateTime(new Date(item.occurredAt), {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </time>
    </div>
  );
}

export function AdminDashboardView({ data }: { data: PlatformDashboardData }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [period, setPeriod] = useState<PlatformStatsPeriod>("today");
  const { stats, activity } = data;

  const isEmpty =
    stats.merchants.total === 0 &&
    stats.customers.total === 0 &&
    stats.stampsIssued.allTime === 0;

  const periodStamps = stats.stampsIssued[period];
  const periodRedemptions = stats.redemptions[period];

  const statCards = [
    {
      key: "merchants",
      icon: Building2,
      label: t("stats.merchants"),
      value: stats.merchants.total,
      hint: t("stats.merchantsHint", { active: stats.merchants.active }),
    },
    {
      key: "customers",
      icon: Users,
      label: t("stats.customers"),
      value: stats.customers.total,
      hint: t("stats.customersHint", { active: stats.customers.active }),
    },
    {
      key: "stamps",
      icon: Stamp,
      label: t("stats.stamps"),
      value: periodStamps,
      hint: t(`stats.period.${period}`),
    },
    {
      key: "redemptions",
      icon: Gift,
      label: t("stats.redemptions"),
      value: periodRedemptions,
      hint: t(`stats.period.${period}`),
    },
    {
      key: "disputes",
      icon: MessageSquare,
      label: t("stats.openDisputes"),
      value: stats.openDisputes,
      hint:
        stats.overdueDisputes > 0
          ? t("stats.overdueDisputesHint", { count: stats.overdueDisputes })
          : t("stats.openDisputesHint"),
    },
    {
      key: "mrr",
      icon: Wallet,
      label: t("stats.mrrStub"),
      value: format.number(stats.mrrStubNpr, {
        style: "currency",
        currency: "NPR",
        maximumFractionDigits: 0,
      }),
      hint: t("stats.mrrStubHint"),
      isFormatted: true,
    },
  ] as const;

  const quickLinks = [
    {
      href: "/admin/merchants",
      icon: Building2,
      title: t("links.merchants.title"),
      description: t("links.merchants.description"),
      badge:
        stats.merchants.pending > 0
          ? t("links.merchants.pending", { count: stats.merchants.pending })
          : null,
    },
    {
      href: "/admin/disputes",
      icon: MessageSquare,
      title: t("links.disputes.title"),
      description: t("links.disputes.description"),
      badge:
        stats.overdueDisputes > 0
          ? t("links.disputes.overdue", { count: stats.overdueDisputes })
          : stats.openDisputes > 0
            ? t("links.disputes.open", { count: stats.openDisputes })
            : null,
    },
    {
      href: "/admin/customers",
      icon: Users,
      title: t("links.customers.title"),
      description: t("links.customers.description"),
      badge: null,
    },
    {
      href: "/admin/audit",
      icon: ClipboardList,
      title: t("links.audit.title"),
      description: t("links.audit.description"),
      badge: null,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {isEmpty ? (
        <Card className="admin-card">
          <CardContent className="py-10 text-center">
            <p className="font-medium">{t("empty.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
            <Button asChild className="mt-4 bg-brand-purple hover:bg-brand-purple/90">
              <Link href="/admin/merchants">{t("empty.cta")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label={t("stats.regionLabel")}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const displayValue =
            "isFormatted" in stat && stat.isFormatted ? stat.value : stat.value;
          return (
            <Card key={stat.key} className="admin-card">
              <CardHeader className="gap-1.5">
                <CardDescription className="admin-stat-label flex items-center gap-2">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
                  {displayValue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3" aria-label={t("links.regionLabel")}>
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="group block">
              <Card className="admin-card h-full transition-colors hover:border-primary/30">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5 text-muted-foreground" aria-hidden />
                    </div>
                    {link.badge ? (
                      <Badge variant="secondary">{link.badge}</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t("links.open")}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="space-y-4" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-semibold">
          {t("activity.title")}
        </h2>
        {activity.length === 0 ? (
          <Card className="admin-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("activity.empty")}
            </CardContent>
          </Card>
        ) : (
          <Card className="admin-card divide-y divide-border">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

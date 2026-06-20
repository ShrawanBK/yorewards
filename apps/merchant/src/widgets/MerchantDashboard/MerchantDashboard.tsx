import Link from "next/link";
import { ArrowRight, Building2, CreditCard, Gift, MapPin, Settings, Stamp, Users } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";
import type { Database } from "@repo/supabase/types";
import { getTranslations } from "next-intl/server";
import { MerchantStatusPanel } from "@/features/dashboard";
import { StampQueuePanel } from "@/features/stamp-queue";
import { PageHeader } from "@/shared/ui/PageHeader";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

type DashboardMetrics = {
  branchCount: number;
  activeBranchCount: number;
  loyaltyCardConfigured: boolean;
  loyaltyCardName: string | null;
  activeCollectors: number;
  stampsThisWeek: number;
  redeemedThisWeek: number;
};

export async function MerchantDashboard({
  merchant,
  metrics,
  pendingQueue,
  activeBranchName,
}: {
  merchants: MerchantRow[];
  merchant: Merchant;
  metrics: DashboardMetrics;
  pendingQueue: PendingStampQueueItem[];
  activeBranchName: string | null;
}) {
  const t = await getTranslations("dashboard");

  const quickActions = [
    {
      href: "/merchant/redeem",
      icon: Gift,
      title: t("quickActions.redeem.title"),
      description: t("quickActions.redeem.description"),
    },
    {
      href: "/merchant/analytics",
      icon: Stamp,
      title: t("quickActions.analytics.title"),
      description: t("quickActions.analytics.description"),
    },
    {
      href: "/merchant/business",
      icon: Building2,
      title: t("quickActions.business.title"),
      description: t("quickActions.business.description"),
    },
    {
      href: "/merchant/loyalty-card",
      icon: CreditCard,
      title: t("quickActions.loyaltyCard.title"),
      description: t("quickActions.loyaltyCard.description"),
    },
    {
      href: "/merchant/settings",
      icon: Settings,
      title: t("quickActions.settings.title"),
      description: t("quickActions.settings.description"),
    },
  ] as const;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("welcome", { name: merchant.business_name })}
        description={t("subtitle")}
      />

      <StampQueuePanel
        merchantId={merchant.id}
        isActive={merchant.status === "active"}
        initialItems={pendingQueue}
        loyaltyCardConfigured={metrics.loyaltyCardConfigured}
        activeBranchName={activeBranchName}
      />

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={t("stats.regionLabel")}
      >
        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription className="merchant-stat-label flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden />
              {t("stats.collectors")}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.activeCollectors}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription className="merchant-stat-label flex items-center gap-2">
              <Stamp className="size-4 shrink-0" aria-hidden />
              {t("stats.stampsWeek")}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.stampsThisWeek}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription className="merchant-stat-label flex items-center gap-2">
              <Gift className="size-4 shrink-0" aria-hidden />
              {t("stats.redeemedWeek")}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.redeemedThisWeek}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="merchant-glass-card">
          <CardHeader className="gap-1.5">
            <CardDescription className="merchant-stat-label flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {t("stats.branches")}
            </CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {metrics.branchCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="merchant-body-muted">
              {t("stats.activeBranches", { count: metrics.activeBranchCount })}
            </p>
          </CardContent>
        </Card>
      </section>

      <MerchantStatusPanel
        businessName={merchant.business_name}
        status={merchant.status}
        rejectionReason={merchant.rejection_reason}
      />

      <section className="space-y-4" aria-labelledby="dashboard-quick-actions">
        <h2
          id="dashboard-quick-actions"
          className="text-lg font-semibold tracking-tight text-pretty"
        >
          {t("quickActions.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="merchant-glass-card group flex flex-col gap-3 p-5 transition-colors hover:border-primary/45 hover:bg-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary-dark transition-colors group-hover:bg-primary/18 dark:text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{action.title}</p>
                  <p className="merchant-body-muted">{action.description}</p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary-dark dark:text-primary">
                  {t("quickActions.open")}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {merchant.status === "active" ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/merchant/loyalty-card">{t("links.loyaltyCard")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/merchant/business">{t("links.business")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

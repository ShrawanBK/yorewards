"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, Inbox, Sparkles } from "lucide-react";
import { Button } from "@repo/ui/button";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";
import { StampQueueItem } from "@/features/stamp-queue/components/StampQueueItem";
import {
  useStampQueue,
  useStampQueueTabBadge,
} from "@/features/stamp-queue/hooks/useStampQueue";
import {
  fetchPendingStampQueueAction,
  seedDemoStampQueueAction,
} from "@/features/stamp-queue/api/stampQueueActions";
import { useStampQueueStore } from "@/features/stamp-queue/store/stampQueueStore";
import { isDevEnvironment } from "@/shared/utils/env";
import {
  resolveActionError,
  resolveActionWarning,
} from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function StampQueuePanel({
  merchantId,
  isActive,
  initialItems,
  loyaltyCardConfigured,
}: {
  merchantId: string;
  isActive: boolean;
  initialItems: PendingStampQueueItem[];
  loyaltyCardConfigured: boolean;
}) {
  const t = useTranslations("stampQueue");
  const tErrors = useTranslations("errors.actions");
  const { items } = useStampQueue(merchantId, initialItems);
  const setItems = useStampQueueStore((s) => s.setItems);
  const [isSeeding, startSeed] = useTransition();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [showLoyaltyAlert, setShowLoyaltyAlert] = useState(
    !loyaltyCardConfigured,
  );

  useStampQueueTabBadge(isActive ? items.length : 0);

  const loyaltyAlertCard = showLoyaltyAlert ? (
    <div
      className="merchant-glass-card flex flex-col gap-3 border-amber-500/35 bg-amber-500/8 p-4 sm:flex-row sm:items-start sm:justify-between"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="font-medium text-foreground">{t("demoLoyaltyAlertTitle")}</p>
          <p className="text-sm merchant-body-muted">
            {t("demoLoyaltyAlertDescription")}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/merchant/loyalty-card">{t("demoLoyaltyAlertCta")}</Link>
      </Button>
    </div>
  ) : null;

  function handleSeedDemo() {
    if (!loyaltyCardConfigured) {
      setShowLoyaltyAlert(true);
      return;
    }
    setSeedMessage(null);
    startSeed(async () => {
      const result = await seedDemoStampQueueAction(merchantId);
      if (result.error) {
        if (result.error.code === "DEMO_LOYALTY_CARD_REQUIRED") {
          setShowLoyaltyAlert(true);
        }
        setSeedMessage(resolveActionError(tErrors, result.error));
        return;
      }
      if (result.warning) {
        setSeedMessage(resolveActionWarning(tErrors, result.warning));
      } else {
        const message = result.code
          ? t("demoSeededWithCode", { code: result.code })
          : t("demoSeeded");
        setSeedMessage(message);
        showActionSuccess(t, "success.demoSeeded");
      }
      const refreshed = await fetchPendingStampQueueAction(merchantId);
      if (refreshed.items) setItems(refreshed.items);
    });
  }

  if (!isActive) {
    return (
      <section
        className="merchant-glass-card p-6"
        aria-labelledby="stamp-queue-heading"
      >
        <h2 id="stamp-queue-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="merchant-body-muted mt-2">{t("inactiveNotice")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="stamp-queue-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="stamp-queue-heading" className="text-lg font-semibold">
            {t("title")}
          </h2>
          <p className="merchant-body-muted text-sm">{t("subtitle")}</p>
        </div>
        {isDevEnvironment ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSeeding || !loyaltyCardConfigured}
            onClick={handleSeedDemo}
          >
            <Sparkles className="size-4" aria-hidden />
            {t("loadDemo")}
          </Button>
        ) : null}
      </div>

      {loyaltyAlertCard}

      {seedMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {seedMessage}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="merchant-glass-card flex flex-col items-center gap-4 px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="merchant-body-muted text-sm">{t("emptyDescription")}</p>
          </div>
          {!loyaltyCardConfigured ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/loyalty-card">{t("emptyCta")}</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {items.map((item) => (
            <li key={item.id}>
              <StampQueueItem item={item} merchantId={merchantId} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

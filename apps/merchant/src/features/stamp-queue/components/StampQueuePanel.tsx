"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Inbox, Sparkles } from "lucide-react";
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

export function StampQueuePanel({
  merchantId,
  isActive,
  initialItems,
}: {
  merchantId: string;
  isActive: boolean;
  initialItems: PendingStampQueueItem[];
}) {
  const t = useTranslations("stampQueue");
  const { items } = useStampQueue(merchantId, initialItems);
  const setItems = useStampQueueStore((s) => s.setItems);
  const [isSeeding, startSeed] = useTransition();
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useStampQueueTabBadge(isActive ? items.length : 0);

  function handleSeedDemo() {
    setSeedMessage(null);
    startSeed(async () => {
      const result = await seedDemoStampQueueAction(merchantId);
      if (result.error) {
        setSeedMessage(result.error);
        return;
      }
      if (result.warning) {
        setSeedMessage(result.warning);
      } else {
        setSeedMessage(
          result.code
            ? t("demoSeededWithCode", { code: result.code })
            : t("demoSeeded"),
        );
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
            disabled={isSeeding}
            onClick={handleSeedDemo}
          >
            <Sparkles className="size-4" aria-hidden />
            {t("loadDemo")}
          </Button>
        ) : null}
      </div>

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
          <Button asChild variant="outline" size="sm">
            <Link href="/merchant/loyalty-card">{t("emptyCta")}</Link>
          </Button>
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

"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { CustomerWalletCard } from "@/features/wallet/types/wallet.types";

function isRewardReady(status: CustomerWalletCard["rewardStatus"]) {
  return status === "pending_otp" || status === "unlocked";
}

export function WalletCardTile({ card }: { card: CustomerWalletCard }) {
  const t = useTranslations("wallet");
  const progress =
    card.stampTarget > 0
      ? Math.min(100, Math.round((card.currentStamps / card.stampTarget) * 100))
      : 0;
  const rewardReady = isRewardReady(card.rewardStatus);

  return (
    <Link
      href={`/wallet/${card.id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-border/60 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        rewardReady && "ring-2 ring-brand-amber/60",
      )}
    >
      <div
        className="relative p-4 text-white"
        style={{ backgroundColor: card.primaryColor }}
      >
        <div className="flex items-start gap-3">
          {card.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- merchant logos are external Supabase URLs
            <img
              src={card.logoUrl}
              alt=""
              className="size-11 shrink-0 rounded-full border border-white/30 bg-white object-cover"
            />
          ) : (
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-sm font-semibold"
              aria-hidden
            >
              {card.businessName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-white/80">
              {card.businessName}
            </p>
            <h2 className="truncate text-lg font-semibold leading-tight">
              {card.cardName}
            </h2>
          </div>
          {rewardReady ? (
            <Badge className="shrink-0 border-white/30 bg-white/15 text-white hover:bg-white/15">
              <Gift className="mr-1 size-3.5" aria-hidden />
              {t("rewardReady")}
            </Badge>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/85">{t("stamps")}</span>
            <span className="font-semibold tabular-nums">
              {t("stampProgress", {
                current: card.currentStamps,
                target: card.stampTarget,
              })}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={card.currentStamps}
            aria-valuemin={0}
            aria-valuemax={card.stampTarget}
            aria-label={t("stampProgressAria", {
              current: card.currentStamps,
              target: card.stampTarget,
            })}
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      {card.description ? (
        <p className="line-clamp-2 bg-card px-4 py-3 text-sm text-muted-foreground">
          {card.description}
        </p>
      ) : null}
    </Link>
  );
}

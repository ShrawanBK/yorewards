"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { useAuthStore } from "@/features/auth";
import { useCustomerWallet } from "@/features/wallet/hooks/useCustomerWallet";
import { WalletCardTile } from "@/features/wallet/components/WalletCardTile";

function isRewardReady(
  status: "collecting" | "pending_otp" | "unlocked",
): boolean {
  return status === "pending_otp" || status === "unlocked";
}

export function WalletHomeView() {
  const t = useTranslations("wallet");
  const customerId = useAuthStore((s) => s.customerId);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const { data: cards, isLoading, isError } = useCustomerWallet(customerId);

  const rewardReadyCards =
    cards?.filter((card) => isRewardReady(card.rewardStatus)) ?? [];

  if (isAuthLoading || isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-destructive" role="alert">
          {t("loadError")}
        </p>
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
          <ScanLine className="size-8" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("empty.title")}</h1>
          <p className="text-muted-foreground">{t("empty.description")}</p>
        </div>
        <Button
          asChild
          className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
        >
          <Link href="/scan">{t("empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-6 pb-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {rewardReadyCards.length > 0 ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4"
          role="status"
        >
          <Gift className="mt-0.5 size-5 shrink-0 text-brand-amber" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium">{t("banner.title")}</p>
            <p className="text-sm text-muted-foreground">{t("banner.description")}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.25, ease: "easeOut" }}
          >
            <WalletCardTile card={card} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

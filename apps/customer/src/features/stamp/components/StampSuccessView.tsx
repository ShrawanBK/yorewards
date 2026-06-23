"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, Stamp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import type { StampSuccessDetails } from "@/features/stamp/types/stamp.types";

type StampSuccessViewProps = StampSuccessDetails;

function isRewardReady(rewardStatus: StampSuccessDetails["rewardStatus"]): boolean {
  return rewardStatus === "pending_otp" || rewardStatus === "unlocked";
}

export function StampSuccessView({
  customerCardId,
  currentStamps,
  stampTarget,
  rewardStatus,
  cardName,
  businessName,
}: StampSuccessViewProps) {
  const t = useTranslations("stamp.success");
  const shouldReduceMotion = useReducedMotion();
  const rewardReady = isRewardReady(rewardStatus);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <motion.div
        className="flex size-24 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple"
        initial={shouldReduceMotion ? false : { scale: 0 }}
        animate={{ scale: shouldReduceMotion ? 1 : [0, 1.15, 1] }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.3, type: "spring", stiffness: 400, damping: 15 }
        }
      >
        <Stamp className="size-12" aria-hidden />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm font-medium text-foreground">
          {businessName} · {cardName}
        </p>
        <p className="text-lg font-semibold text-brand-purple">
          {t("progress", { current: currentStamps, target: stampTarget })}
        </p>
      </div>

      {rewardReady ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4">
          <Gift className="size-6 text-brand-amber" aria-hidden />
          <p className="text-sm font-medium">{t("rewardReady")}</p>
          <Button
            asChild
            className="min-h-11 w-full bg-brand-amber text-foreground hover:bg-brand-amber/90"
          >
            <Link href={`/reward/${customerCardId}`}>{t("claimReward")}</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          asChild
          className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
        >
          <Link href="/wallet">{t("backToWallet")}</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/scan">{t("scanAgain")}</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";

export function StampSuccessView() {
  const t = useTranslations("stamp.success");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
        <CheckCircle2 className="size-10" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Button
        asChild
        className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
      >
        <Link href="/wallet">{t("backToWallet")}</Link>
      </Button>
    </div>
  );
}

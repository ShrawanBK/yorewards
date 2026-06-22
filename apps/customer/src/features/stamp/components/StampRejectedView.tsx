"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";

export function StampRejectedView() {
  const t = useTranslations("stamp.rejected");
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="size-10" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {reason ? reason : t("subtitle")}
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          asChild
          className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
        >
          <Link href="/scan">{t("tryAgain")}</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/wallet">{t("backToWallet")}</Link>
        </Button>
      </div>
    </div>
  );
}

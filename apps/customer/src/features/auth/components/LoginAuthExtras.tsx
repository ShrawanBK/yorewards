"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { PwaInstallHint } from "@/features/pwa";

export function LoginAuthExtras() {
  const t = useTranslations("profile");

  return (
    <div className="flex w-full flex-col gap-4">
      <PwaInstallHint />
      <Button asChild variant="outline" className="min-h-11 w-full">
        <Link href="/privacy">{t("privacyLink")}</Link>
      </Button>
    </div>
  );
}

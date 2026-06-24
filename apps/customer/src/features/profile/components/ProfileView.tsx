"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { useTranslations } from "next-intl";
import { customerLogoutAction } from "@/features/auth";
import { PwaInstallHint } from "@/features/pwa";
import { PRIVACY_EMAIL } from "@/shared/constants/contact";
import type { CustomerProfile } from "@/features/auth/types/auth.types";

export function ProfileView({
  customer,
}: {
  customer: CustomerProfile | null;
}) {
  const t = useTranslations("profile");
  const deletionMailto = `mailto:${PRIVACY_EMAIL}?subject=${encodeURIComponent(t("deletionEmailSubject"))}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">{t("name")}</dt>
          <dd className="font-medium">{customer?.name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt className="text-muted-foreground">{t("phone")}</dt>
          <dd className="font-medium">{customer?.phone ?? "—"}</dd>
        </div>
      </dl>
      <PwaInstallHint />
      <div className="space-y-3 border-t border-border pt-4">
        <Button asChild variant="outline" className="min-h-11 w-full">
          <Link href="/privacy">{t("privacyLink")}</Link>
        </Button>
        <div className="space-y-1">
          <Button asChild variant="outline" className="min-h-11 w-full">
            <a href={deletionMailto}>{t("requestDeletion")}</a>
          </Button>
          <p className="text-xs text-muted-foreground">{t("requestDeletionHint")}</p>
        </div>
      </div>
      <form action={customerLogoutAction}>
        <Button type="submit" variant="outline" className="min-h-11 w-full">
          {t("logout")}
        </Button>
      </form>
    </div>
  );
}

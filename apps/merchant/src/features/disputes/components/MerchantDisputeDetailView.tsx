"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes-shared";
import { MerchantDisputeCard } from "@/features/disputes/components/MerchantDisputeCard";
import { showActionSuccess } from "@/shared/utils/action-feedback";

/** Survives React Strict Mode remounts so the switch toast only fires once. */
const shownBusinessSwitchToasts = new Set<string>();

export function MerchantDisputeDetailView({
  dispute,
  merchantId,
  switchedBusinessName = null,
}: {
  dispute: StampDisputeListItem;
  merchantId: string;
  switchedBusinessName?: string | null;
}) {
  const t = useTranslations("disputes");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!switchedBusinessName) return;

    const toastKey = `${dispute.id}:${switchedBusinessName}`;
    if (!shownBusinessSwitchToasts.has(toastKey)) {
      shownBusinessSwitchToasts.add(toastKey);
      showActionSuccess(tNav, "success.businessSwitched", {
        business: switchedBusinessName,
      });
    }

    router.replace(pathname);
  }, [dispute.id, pathname, router, switchedBusinessName, tNav]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-foreground"
        asChild
      >
        <Link href="/merchant/disputes">
          <ArrowLeft className="size-4" aria-hidden />
          {t("detail.backToList")}
        </Link>
      </Button>

      <MerchantDisputeCard
        dispute={dispute}
        merchantId={merchantId}
        showDetailLink={false}
        onResolved={() => router.refresh()}
      />
    </div>
  );
}

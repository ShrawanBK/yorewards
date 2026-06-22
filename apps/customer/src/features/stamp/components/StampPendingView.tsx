"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getStampSessionStatusAction } from "@/features/stamp/api/stampActions";
import { subscribeStampSession } from "@/features/stamp/lib/subscribeStampSession";
import { useAuthStore } from "@/features/auth";
import { invalidateCustomerWallet } from "@/features/wallet/api/walletQueries";
import { isActionFailure } from "@/shared/types/action-result";

type StampPendingViewProps = {
  sessionId: string;
};

function routeForStatus(
  sessionId: string,
  status: string,
  rejectionReason?: string | null,
): string | null {
  if (status === "approved") return `/stamp/success/${sessionId}`;
  if (status === "rejected") {
    const params = rejectionReason
      ? `?reason=${encodeURIComponent(rejectionReason)}`
      : "";
    return `/stamp/rejected/${sessionId}${params}`;
  }
  if (status === "expired") return "/wallet";
  return null;
}

export function StampPendingView({ sessionId }: StampPendingViewProps) {
  const t = useTranslations("stamp.pending");
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useAuthStore((s) => s.customerId);

  useEffect(() => {
    void getStampSessionStatusAction(sessionId).then((result) => {
      if (isActionFailure(result)) {
        router.replace("/wallet");
        return;
      }

      const path = routeForStatus(
        sessionId,
        result.status,
        result.rejectionReason,
      );
      if (path) router.replace(path);
    });
  }, [sessionId, router]);

  useEffect(() => {
    return subscribeStampSession(sessionId, (status, rejectionReason) => {
      if (status === "approved" && customerId) {
        void invalidateCustomerWallet(queryClient, customerId);
      }

      const path = routeForStatus(sessionId, status, rejectionReason);
      if (path) router.replace(path);
    });
  }, [sessionId, router, queryClient, customerId]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        className="size-16 animate-spin rounded-full border-4 border-brand-purple border-t-transparent"
        role="status"
        aria-label={t("loadingAria")}
      />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
    </div>
  );
}

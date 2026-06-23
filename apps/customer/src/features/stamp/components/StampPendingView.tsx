"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { STAMP_PENDING_TTL_MS } from "@/features/stamp/constants";
import { getStampSessionStatusAction } from "@/features/stamp/api/stampActions";
import { StampPendingSpinner } from "@/features/stamp/components/StampPendingSpinner";
import { subscribeStampSession } from "@/features/stamp/lib/subscribeStampSession";
import { useAuthStore } from "@/features/auth";
import { invalidateCustomerWallet } from "@/features/wallet/api/walletQueries";
import { isActionFailure } from "@/shared/types/action-result";

type StampPendingViewProps = {
  sessionId: string;
  createdAt: string;
};

function routeForStatus(sessionId: string, status: string): string | null {
  if (status === "approved") return `/stamp/success/${sessionId}`;
  if (status === "rejected") return `/stamp/rejected/${sessionId}`;
  if (status === "expired") return `/stamp/expired/${sessionId}`;
  return null;
}

export function StampPendingView({
  sessionId,
  createdAt,
}: StampPendingViewProps) {
  const t = useTranslations("stamp.pending");
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useAuthStore((s) => s.customerId);

  useEffect(() => {
    const expiresAt = new Date(createdAt).getTime() + STAMP_PENDING_TTL_MS;

    const checkExpiry = () => {
      if (Date.now() >= expiresAt) {
        router.replace(`/stamp/expired/${sessionId}`);
      }
    };

    checkExpiry();
    const intervalId = window.setInterval(checkExpiry, 1000);
    return () => window.clearInterval(intervalId);
  }, [createdAt, router, sessionId]);

  useEffect(() => {
    void getStampSessionStatusAction(sessionId).then((result) => {
      if (isActionFailure(result)) {
        router.replace("/wallet");
        return;
      }

      const path = routeForStatus(sessionId, result.status);
      if (path) router.replace(path);
    });
  }, [sessionId, router]);

  useEffect(() => {
    return subscribeStampSession(sessionId, (status) => {
      if (status === "approved" && customerId) {
        void invalidateCustomerWallet(queryClient, customerId);
      }

      const path = routeForStatus(sessionId, status);
      if (path) router.replace(path);
    });
  }, [sessionId, router, queryClient, customerId]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <StampPendingSpinner />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
    </div>
  );
}

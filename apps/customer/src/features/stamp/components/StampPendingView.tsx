"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  STAMP_PENDING_TTL_MS,
  STAMP_STATUS_POLL_MS,
} from "@/features/stamp/constants";
import { fetchStampSessionStatus } from "@/features/stamp/api/stampSessionStatus";
import { StampPendingSpinner } from "@/features/stamp/components/StampPendingSpinner";
import { subscribeStampSession } from "@/features/stamp/lib/subscribeStampSession";
import { useAuthStore } from "@/features/auth";
import { refreshCustomerWallet } from "@/features/wallet/api/walletQueries";
import { isActionFailure } from "@/shared/types/action-result";
import type { StampSessionStatus } from "@repo/supabase/types";

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
  const navigatedRef = useRef(false);

  const handleStatus = useCallback(
    async (status: StampSessionStatus, source: "poll" | "websocket") => {
      if (navigatedRef.current) return;

      const path = routeForStatus(sessionId, status);
      if (!path) return;

      if (process.env.NODE_ENV === "development") {
        console.log(`[stamp-pending] navigating via ${source}:`, status);
      }

      navigatedRef.current = true;
      if (status === "approved" && customerId) {
        await refreshCustomerWallet(queryClient, customerId);
      }
      router.replace(path);
      router.refresh();
    },
    [sessionId, router, queryClient, customerId],
  );

  const pollStatus = useCallback(async () => {
    if (navigatedRef.current) return;

    try {
      const result = await fetchStampSessionStatus(sessionId);
      if (navigatedRef.current) return;

      if (isActionFailure(result)) {
        if (result.error.code === "STAMP_SESSION_NOT_FOUND") {
          navigatedRef.current = true;
          router.replace("/wallet");
        }
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[stamp-pending] poll:", result.status);
      }

      void handleStatus(result.status, "poll");
    } catch {
      // Network blip — keep polling.
    }
  }, [sessionId, router, handleStatus]);

  const handleRealtimeStatus = useCallback(
    (status: StampSessionStatus) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[stamp-pending] websocket event:", status);
      }
      void handleStatus(status, "websocket");
    },
    [handleStatus],
  );

  useEffect(() => {
    const expiresAt = new Date(createdAt).getTime() + STAMP_PENDING_TTL_MS;

    const checkExpiry = () => {
      if (navigatedRef.current) return;
      if (Date.now() >= expiresAt) {
        navigatedRef.current = true;
        router.replace(`/stamp/expired/${sessionId}`);
      }
    };

    checkExpiry();
    const intervalId = window.setInterval(checkExpiry, 1000);
    return () => window.clearInterval(intervalId);
  }, [createdAt, router, sessionId]);

  useEffect(() => {
    void pollStatus();
    const intervalId = window.setInterval(
      () => void pollStatus(),
      STAMP_STATUS_POLL_MS,
    );

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pollStatus();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollStatus]);

  useEffect(() => {
    return subscribeStampSession(sessionId, handleRealtimeStatus);
  }, [sessionId, handleRealtimeStatus]);

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

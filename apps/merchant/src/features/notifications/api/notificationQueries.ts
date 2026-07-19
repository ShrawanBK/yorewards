"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { NotificationRow } from "@repo/supabase/queries/notifications";
import {
  getMerchantUnreadCountAction,
  listMerchantNotificationsAction,
} from "@/features/notifications/api/notificationActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export const merchantNotificationsQueryKey = ["merchant-notifications"] as const;
export const merchantUnreadCountQueryKey = ["merchant-notifications-unread"] as const;

export function useMerchantNotifications(initialData?: NotificationRow[]) {
  const tErrors = useTranslations("errors.actions");

  return useQuery({
    queryKey: merchantNotificationsQueryKey,
    queryFn: async () => {
      const result = await listMerchantNotificationsAction();
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.notifications;
    },
    initialData,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMerchantUnreadCount(initialCount = 0) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: merchantUnreadCountQueryKey,
    queryFn: async () => {
      const result = await getMerchantUnreadCountAction();
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.count;
    },
    initialData: initialCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    ...query,
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: merchantNotificationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: merchantUnreadCountQueryKey });
    },
  };
}

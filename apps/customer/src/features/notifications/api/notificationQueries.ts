"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { NotificationRow } from "@repo/supabase/queries/notifications";
import {
  getCustomerUnreadCountAction,
  listCustomerNotificationsAction,
} from "@/features/notifications/api/notificationActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export const customerNotificationsQueryKey = ["customer-notifications"] as const;
export const customerUnreadCountQueryKey = ["customer-notifications-unread"] as const;

export function useCustomerNotifications(initialData?: NotificationRow[]) {
  const tErrors = useTranslations("errors.actions");

  return useQuery({
    queryKey: customerNotificationsQueryKey,
    queryFn: async () => {
      const result = await listCustomerNotificationsAction();
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

export function useCustomerUnreadCount(initialCount = 0) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: customerUnreadCountQueryKey,
    queryFn: async () => {
      const result = await getCustomerUnreadCountAction();
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
      void queryClient.invalidateQueries({ queryKey: customerNotificationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: customerUnreadCountQueryKey });
    },
  };
}

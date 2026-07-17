"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { NotificationRow } from "@repo/supabase/queries/notifications";
import {
  getAdminUnreadCountAction,
  listAdminNotificationsAction,
} from "@/features/notifications/api/notificationActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export const adminNotificationsQueryKey = ["admin-notifications"] as const;
export const adminUnreadCountQueryKey = ["admin-notifications-unread"] as const;

export function useAdminNotifications(initialData?: NotificationRow[]) {
  const tErrors = useTranslations("errors.actions");

  return useQuery({
    queryKey: adminNotificationsQueryKey,
    queryFn: async () => {
      const result = await listAdminNotificationsAction();
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

export function useAdminUnreadCount(initialCount = 0) {
  const tErrors = useTranslations("errors.actions");
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: adminUnreadCountQueryKey,
    queryFn: async () => {
      const result = await getAdminUnreadCountAction();
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
      void queryClient.invalidateQueries({ queryKey: adminNotificationsQueryKey });
      void queryClient.invalidateQueries({ queryKey: adminUnreadCountQueryKey });
    },
  };
}

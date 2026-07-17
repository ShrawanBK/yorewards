"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import type { NotificationRow } from "@repo/supabase/queries/notifications";
import {
  markAllAdminNotificationsReadAction,
  markAdminNotificationReadAction,
} from "@/features/notifications/api/notificationActions";
import {
  useAdminNotifications,
  useAdminUnreadCount,
} from "@/features/notifications/api/notificationQueries";
import {
  ADMIN_NOTIFICATION_CATEGORIES,
  getNotificationActionHref,
  getNotificationActionLabelKey,
  getNotificationCategory,
  type NotificationCategory,
} from "@/features/notifications/utils/notification-meta";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

function messageKey(storedKey: string) {
  return storedKey.startsWith("notifications.")
    ? storedKey.slice("notifications.".length)
    : storedKey;
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationRow;
  onRead: (id: string) => Promise<void>;
}) {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const isUnread = !item.readAt;
  const payload = item.payload as Record<string, string | number | Date>;
  const href = getNotificationActionHref(item);
  const actionLabelKey = getNotificationActionLabelKey(item.type);
  const category = getNotificationCategory(item.type);

  async function handleActivate() {
    if (isUnread) await onRead(item.id);
  }

  return (
    <article
      className={`rounded-xl border border-border p-4 ${
        isUnread ? "bg-muted/40" : "bg-background"
      }`}
      aria-labelledby={`notification-${item.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={`notification-${item.id}-title`}
              className="text-sm font-semibold"
            >
              {t(messageKey(item.titleKey), payload)}
            </h2>
            {isUnread ? (
              <Badge variant="secondary" className="text-[10px]">
                {t("centre.unread")}
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px]">
              {t(`categories.${category}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(messageKey(item.bodyKey), payload)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format.relativeTime(new Date(item.createdAt), Date.now())}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {isUnread && !href ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-foreground"
              onClick={() => void onRead(item.id)}
            >
              {t("centre.markRead")}
            </Button>
          ) : null}
          {href ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-foreground"
              asChild
            >
              <Link href={href} onClick={() => void handleActivate()}>
                {t(actionLabelKey)}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function NotificationList({
  items,
  onRead,
  emptyTitle,
  emptyDescription,
}: {
  items: NotificationRow[];
  onRead: (id: string) => Promise<void>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return (
      <div className="space-y-1 rounded-xl border border-border px-4 py-10 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <NotificationCard key={item.id} item={item} onRead={onRead} />
      ))}
    </div>
  );
}

export function NotificationsCentreView() {
  const t = useTranslations("notifications");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");
  const { data: unreadCount = 0, invalidate } = useAdminUnreadCount();
  const { data: notifications = [], isFetching } = useAdminNotifications();

  const byCategory = useMemo(() => {
    const map: Record<NotificationCategory, NotificationRow[]> = {
      disputes: [],
      account: [],
    };
    for (const item of notifications) {
      map[getNotificationCategory(item.type)].push(item);
    }
    return map;
  }, [notifications]);

  const visible =
    category === "all" ? notifications : byCategory[category];

  async function handleMarkRead(id: string) {
    setError(null);
    const result = await markAdminNotificationReadAction(id);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    invalidate();
  }

  async function handleMarkAllRead() {
    setError(null);
    const result = await markAllAdminNotificationsReadAction();
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    invalidate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-foreground"
          disabled={unreadCount === 0}
          onClick={() => void handleMarkAllRead()}
        >
          {t("centre.markAllRead")}
        </Button>
        {isFetching ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t("centre.refreshing")}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <Badge variant="destructive">
            {t("centre.unreadCount", { count: unreadCount })}
          </Badge>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Tabs
        value={category}
        onValueChange={(value) =>
          setCategory(value as "all" | NotificationCategory)
        }
      >
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="all">{t("categories.all")}</TabsTrigger>
          {ADMIN_NOTIFICATION_CATEGORIES.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`categories.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category} className="mt-4">
          <NotificationList
            items={visible}
            onRead={handleMarkRead}
            emptyTitle={t("centre.emptyTitle")}
            emptyDescription={t("centre.emptyDescription")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

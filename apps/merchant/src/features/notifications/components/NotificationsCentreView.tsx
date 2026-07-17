"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { cn } from "@repo/ui/lib/utils";
import type { NotificationRow } from "@repo/supabase/queries/notifications";
import {
  markAllMerchantNotificationsReadAction,
  markMerchantNotificationReadAction,
} from "@/features/notifications/api/notificationActions";
import {
  useMerchantNotifications,
  useMerchantUnreadCount,
} from "@/features/notifications/api/notificationQueries";
import {
  getNotificationActionHref,
  getNotificationActionLabelKey,
  getNotificationCategory,
  MERCHANT_NOTIFICATION_CATEGORIES,
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
      className={cn(
        "merchant-glass-card rounded-xl border p-4",
        isUnread
          ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-muted/20 opacity-80",
      )}
      aria-labelledby={`notification-${item.id}-title`}
      data-unread={isUnread ? "true" : "false"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isUnread ? (
              <span
                className="size-2 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
            ) : null}
            <h3
              id={`notification-${item.id}-title`}
              className={cn(
                "text-sm",
                isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
              )}
            >
              {t(messageKey(item.titleKey), payload)}
            </h3>
            <Badge
              variant={isUnread ? "default" : "outline"}
              className={cn(
                "text-[10px]",
                isUnread ? "" : "text-muted-foreground",
              )}
            >
              {isUnread ? t("centre.unread") : t("centre.read")}
            </Badge>
            <Badge variant="outline" className="text-[10px] text-foreground">
              {t(`categories.${category}`)}
            </Badge>
          </div>
          <p
            className={cn(
              "text-sm",
              isUnread ? "text-foreground/90" : "merchant-body-muted",
            )}
          >
            {t(messageKey(item.bodyKey), payload)}
          </p>
          <p className="merchant-body-muted text-xs">
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
      <div className="merchant-glass-card space-y-1 rounded-xl border border-border px-4 py-10 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="merchant-body-muted text-sm">{emptyDescription}</p>
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
  const { data: unreadCount = 0, invalidate } = useMerchantUnreadCount();
  const { data: notifications = [], isFetching } = useMerchantNotifications();

  const byCategory = useMemo(() => {
    const map: Record<NotificationCategory, NotificationRow[]> = {
      disputes: [],
      account: [],
      promotions: [],
    };
    for (const item of notifications) {
      map[getNotificationCategory(item.type)].push(item);
    }
    return map;
  }, [notifications]);

  const unreadByCategory = useMemo(() => {
    const map: Record<NotificationCategory, number> = {
      disputes: 0,
      account: 0,
      promotions: 0,
    };
    for (const item of notifications) {
      if (item.readAt) continue;
      map[getNotificationCategory(item.type)] += 1;
    }
    return map;
  }, [notifications]);

  const visible =
    category === "all" ? notifications : byCategory[category];

  async function handleMarkRead(id: string) {
    setError(null);
    const result = await markMerchantNotificationReadAction(id);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    invalidate();
  }

  async function handleMarkAllRead() {
    setError(null);
    const result = await markAllMerchantNotificationsReadAction();
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    invalidate();
  }

  return (
    <div className="space-y-6">
      <div className="merchant-glass-card flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div className="space-y-1">
          {unreadCount > 0 ? (
            <p className="text-sm font-semibold text-foreground">
              {t("centre.unreadSummary", { count: unreadCount })}
            </p>
          ) : null}
          <p className="merchant-body-muted text-xs">
            {t("centre.totalCount", { count: visible.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {unreadCount > 0 ? (
            <Badge variant="destructive" className="text-xs">
              {t("centre.unreadCount", { count: unreadCount })}
            </Badge>
          ) : null}
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
            <span className="merchant-body-muted text-xs" aria-live="polite">
              {t("centre.refreshing")}
            </span>
          ) : null}
        </div>
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
          <TabsTrigger value="all">
            {t("categories.all")}
            {unreadCount > 0 ? (
              <span className="ml-1.5 text-xs opacity-70">({unreadCount})</span>
            ) : null}
          </TabsTrigger>
          {MERCHANT_NOTIFICATION_CATEGORIES.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`categories.${key}`)}
              {unreadByCategory[key] > 0 ? (
                <span className="ml-1.5 text-xs opacity-70">
                  ({unreadByCategory[key]})
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category} className="mt-4">
          <NotificationList
            items={visible}
            onRead={handleMarkRead}
            emptyTitle={
              category === "promotions"
                ? t("centre.promotionsEmptyTitle")
                : t("centre.emptyTitle")
            }
            emptyDescription={
              category === "promotions"
                ? t("centre.promotionsEmptyDescription")
                : t("centre.emptyDescription")
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

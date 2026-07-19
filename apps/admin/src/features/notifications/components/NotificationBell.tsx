"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { useAdminUnreadCount } from "@/features/notifications/api/notificationQueries";

export function NotificationBell({ showLabel = true }: { showLabel?: boolean }) {
  const t = useTranslations("notifications");
  const tA11y = useTranslations("a11y");
  const { data: unreadCount = 0 } = useAdminUnreadCount();

  return (
    <Button
      type="button"
      variant="ghost"
      className="relative gap-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      asChild
    >
      <Link
        href="/admin/notifications"
        aria-label={tA11y("openNotifications", { count: unreadCount })}
      >
        <Bell className="size-[1.125rem]" aria-hidden />
        {showLabel ? t("centre.button") : null}
        {unreadCount > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 min-w-5 justify-center px-1 py-0 text-[10px]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}

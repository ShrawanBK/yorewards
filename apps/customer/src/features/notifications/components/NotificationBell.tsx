"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { useCustomerUnreadCount } from "@/features/notifications/api/notificationQueries";

export function NotificationBell() {
  const tA11y = useTranslations("a11y");
  const { data: unreadCount = 0 } = useCustomerUnreadCount();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative size-11 rounded-full border-border bg-background/90 text-foreground shadow-sm backdrop-blur"
      asChild
    >
      <Link
        href="/notifications"
        aria-label={tA11y("openNotifications", { count: unreadCount })}
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 min-w-5 justify-center px-1 py-0 text-[10px]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}

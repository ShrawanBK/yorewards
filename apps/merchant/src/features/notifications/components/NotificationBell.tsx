"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { useMerchantUnreadCount } from "@/features/notifications/api/notificationQueries";

export function NotificationBell({ showLabel = true }: { showLabel?: boolean }) {
  const t = useTranslations("notifications");
  const tA11y = useTranslations("a11y");
  const { data: unreadCount = 0 } = useMerchantUnreadCount();

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={cn(
        "relative text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        showLabel ? "w-full justify-start gap-3" : "size-9",
      )}
      asChild
    >
      <Link
        href="/merchant/notifications"
        aria-label={tA11y("openNotifications", { count: unreadCount })}
      >
        <Bell className="size-[1.125rem] shrink-0" aria-hidden />
        {showLabel ? <span className="flex-1 text-left">{t("centre.button")}</span> : null}
        {unreadCount > 0 ? (
          <Badge
            variant="destructive"
            className={cn(
              "min-w-5 justify-center px-1.5 py-0 text-[10px]",
              showLabel ? "ml-auto" : "absolute -right-0.5 -top-0.5",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}

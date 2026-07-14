"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Stamp,
  Users,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { logoutAction } from "@/features/auth/api/authActions";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/admin/merchants", icon: Building2, labelKey: "merchants" as const },
  { href: "/admin/disputes", icon: MessageSquare, labelKey: "disputes" as const },
  { href: "/admin/customers", icon: Users, labelKey: "customers" as const },
  { href: "/admin/stamps", icon: Stamp, labelKey: "stamps" as const },
  { href: "/admin/audit", icon: ClipboardList, labelKey: "audit" as const },
  { href: "/admin/settings", icon: Settings, labelKey: "settings" as const },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  async function handleLogout() {
    await logoutAction();
  }

  return (
    <div className="admin-app-bg flex min-h-svh">
      <aside
        className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
        aria-label={t("main")}
      >
        <div className="border-b border-sidebar-border px-4 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground"
              aria-hidden
            >
              YO
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight" translate="no">
                YORewards
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {t("adminLabel")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t("main")}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "admin-nav-link",
                  isActive
                    ? "admin-nav-active"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-3">
          <form action={handleLogout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="size-[1.125rem]" aria-hidden />
              {t("logout")}
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main-content" className="flex-1 scroll-mt-4" tabIndex={-1}>
          <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

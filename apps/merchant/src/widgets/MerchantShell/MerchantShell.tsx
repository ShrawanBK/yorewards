"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { logoutAction } from "@/features/auth/api/authActions";
import { SkipLink } from "@/shared/ui/SkipLink";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

type MerchantShellProps = {
  children: React.ReactNode;
  businessName?: string | null;
};

const navItems = [
  { href: "/merchant/dashboard", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/merchant/business", icon: Building2, labelKey: "business" as const },
  { href: "/merchant/loyalty-card", icon: CreditCard, labelKey: "loyaltyCard" as const },
  { href: "/merchant/settings", icon: Settings, labelKey: "settings" as const },
];

export function MerchantShell({ children, businessName }: MerchantShellProps) {
  const t = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavId = useId();

  async function handleLogout() {
    await logoutAction();
  }

  const navLink = (item: (typeof navItems)[number], onNavigate?: () => void) => {
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "merchant-nav-link",
          isActive
            ? "merchant-nav-active"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
        {t(item.labelKey)}
      </Link>
    );
  };

  return (
    <div className="merchant-app-bg flex min-h-svh">
      <SkipLink href="#main-content">{tA11y("skipToMain")}</SkipLink>

      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
        aria-label={t("main")}
      >
        <div className="flex h-[4.25rem] items-center gap-3 border-b border-sidebar-border px-5">
          <div
            className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground"
            aria-hidden
          >
            YO
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight" translate="no">
              YORewards
            </p>
            {businessName ? (
              <p className="truncate text-xs text-sidebar-foreground/75">{businessName}</p>
            ) : null}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t("main")}>
          {navItems.map((item) => navLink(item))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-sidebar-border p-3">
          <ThemeToggle />
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
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
              aria-hidden
            >
              YO
            </div>
            <span className="text-sm font-semibold tracking-tight" translate="no">
              YORewards
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle showLabel={false} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={mobileOpen}
              aria-controls={mobileNavId}
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
            </Button>
          </div>
        </header>

        {mobileOpen ? (
          <div
            id={mobileNavId}
            className="border-b border-border bg-card p-3 lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label={t("main")}>
              {navItems.map((item) => navLink(item, () => setMobileOpen(false)))}
            </nav>
            <Separator className="my-2" />
            <ThemeToggle />
            <form action={handleLogout} className="mt-1">
              <Button type="submit" variant="ghost" className="w-full justify-start gap-3">
                <LogOut className="size-[1.125rem]" aria-hidden />
                {t("logout")}
              </Button>
            </form>
          </div>
        ) : null}

        <main id="main-content" className="flex-1 scroll-mt-4" tabIndex={-1}>
          <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

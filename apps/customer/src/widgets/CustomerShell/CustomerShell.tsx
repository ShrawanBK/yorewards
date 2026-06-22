"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, User, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/lib/utils";

const navItems = [
  { href: "/wallet", labelKey: "wallet" as const, icon: Wallet },
  { href: "/scan", labelKey: "scan" as const, icon: ScanLine, elevated: true },
  { href: "/profile", labelKey: "profile" as const, icon: User },
];

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const hideNav =
    pathname.startsWith("/stamp/") || pathname.startsWith("/reward/");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main
        className={cn(
          "flex flex-1 flex-col",
          !hideNav && "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
        )}
      >
        {children}
      </main>
      {!hideNav ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
          style={{ viewTransitionName: "customer-bottom-nav" }}
          aria-label={t("aria")}
        >
          <div className="mx-auto flex h-[4.5rem] max-w-lg items-stretch justify-around px-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/wallet" && pathname.startsWith("/wallet"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "text-brand-purple"
                      : "text-muted-foreground hover:text-foreground",
                    item.elevated && "-mt-3",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full",
                      item.elevated &&
                        "size-12 bg-brand-purple text-white shadow-lg",
                      !item.elevated && "size-6",
                    )}
                  >
                    <Icon
                      className={item.elevated ? "size-6" : "size-5"}
                      aria-hidden
                    />
                  </span>
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

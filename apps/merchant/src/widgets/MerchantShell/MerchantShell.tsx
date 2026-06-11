"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { logoutAction } from "@/features/auth/api/authActions";

const NAV_ITEMS = [
  { href: "/merchant/dashboard", key: "dashboard" as const },
  { href: "/merchant/business", key: "business" as const },
  { href: "/merchant/loyalty-card", key: "loyaltyCard" as const },
  { href: "/merchant/settings", key: "settings" as const },
];

export function MerchantShell({
  children,
  businessName,
}: {
  children: React.ReactNode;
  businessName: string;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-brand-purple uppercase">
              YORewards
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {businessName}
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              {t("logout")}
            </Button>
          </form>
        </div>
        <nav
          className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
          aria-label={t("main")}
        >
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/merchant/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-surface text-brand-purple"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}

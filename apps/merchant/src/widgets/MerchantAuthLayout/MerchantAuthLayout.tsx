import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { MerchantAuthScreen } from "@/features/auth";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

export async function MerchantAuthLayout({
  children,
  heading,
  subheading,
}: {
  children?: ReactNode;
  heading?: string;
  subheading?: string;
}) {
  const t = await getTranslations("auth");

  return (
    <div className="merchant-app-bg relative grid min-h-screen lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle showLabel={false} />
      </div>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest opacity-90">
            {t("brandEyebrow")}
          </p>
          <h1 className="max-w-sm text-3xl font-semibold tracking-tight">
            {t("brandTitle")}
          </h1>
        </div>
        <blockquote className="space-y-2 border-l-2 border-primary-foreground/40 pl-4 text-base opacity-90">
          <p>{t("brandBlurb")}</p>
          <footer className="opacity-75">{t("brandFooter")}</footer>
        </blockquote>
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
      </aside>

      <main className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <p className="text-sm font-medium text-primary lg:hidden">
              {t("brandEyebrow")}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {heading ?? t("heading")}
            </h2>
            <p className="text-base merchant-body-muted">
              {subheading ?? t("subheading")}
            </p>
          </div>
          <div className="merchant-glass-card p-6 sm:p-8">
            {children ?? (
              <Suspense>
                <MerchantAuthScreen />
              </Suspense>
            )}
          </div>
          <p className="text-center text-sm merchant-body-muted">
            {t("terms")}
          </p>
        </div>
      </main>
    </div>
  );
}

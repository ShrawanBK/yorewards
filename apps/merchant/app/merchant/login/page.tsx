import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { MerchantAuthScreen } from "@/components/merchant-auth-screen";

export default function MerchantLoginPage() {
  const t = useTranslations("auth");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-deep p-10 text-white lg:flex">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-pink">
            {t("brandEyebrow")}
          </p>
          <h1 className="max-w-sm text-3xl font-semibold tracking-tight">
            {t("brandTitle")}
          </h1>
        </div>
        <blockquote className="space-y-2 border-l-2 border-brand-purple pl-4 text-sm text-white/80">
          <p>{t("brandBlurb")}</p>
          <footer className="text-white/60">{t("brandFooter")}</footer>
        </blockquote>
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand-purple/30 blur-3xl" />
      </aside>

      <main className="flex flex-col items-center justify-center bg-brand-surface p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <p className="text-sm font-medium text-brand-purple lg:hidden">
              {t("brandEyebrow")}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("heading")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("subheading")}</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Suspense>
              <MerchantAuthScreen />
            </Suspense>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t("terms")}
          </p>
        </div>
      </main>
    </div>
  );
}

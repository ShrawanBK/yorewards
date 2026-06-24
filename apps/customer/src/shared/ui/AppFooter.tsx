"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border px-6 py-4 text-center">
      <Link
        href="/privacy"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {t("privacy")}
      </Link>
    </footer>
  );
}

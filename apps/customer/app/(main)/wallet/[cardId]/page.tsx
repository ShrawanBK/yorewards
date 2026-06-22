import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/button";

export default async function WalletCardPlaceholderPage() {
  const t = await getTranslations("wallet");

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t("detailComingSoon")}</h1>
      <p className="text-sm text-muted-foreground">{t("detailComingSoonHint")}</p>
      <Button variant="outline" className="min-h-11" asChild>
        <Link href="/wallet">{t("backToWallet")}</Link>
      </Button>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { Button } from "@repo/ui/button";

type RewardPageProps = {
  params: Promise<{ cardId: string }>;
};

export default async function RewardPage({ params }: RewardPageProps) {
  const { cardId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const supabase = createServiceRoleClient();
  const { data: card } = await supabase
    .from("customer_cards")
    .select("id")
    .eq("id", cardId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (!card) redirect("/wallet");

  const t = await getTranslations("reward.comingSoon");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Button
        asChild
        className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
      >
        <Link href="/wallet">{t("backToWallet")}</Link>
      </Button>
    </div>
  );
}

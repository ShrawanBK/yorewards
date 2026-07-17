import { getTranslations } from "next-intl/server";
import { AcceptInviteView } from "@/features/auth/components/AcceptInviteView";
import { MerchantAuthLayout } from "@/widgets/MerchantAuthLayout";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const t = await getTranslations("acceptInvite");

  return (
    <MerchantAuthLayout heading={t("title")} subheading={t("layoutSubheading")}>
      <AcceptInviteView searchParams={searchParams} />
    </MerchantAuthLayout>
  );
}

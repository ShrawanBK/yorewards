import { getTranslations } from "next-intl/server";
import { getAllMerchantsAction } from "@/features/merchants";
import { getPendingVerificationDocumentsAction } from "@/features/merchants/api/getPendingVerificationDocuments";
import { MerchantQueue } from "@/features/merchants/components/MerchantQueue";
import { VerificationQueue } from "@/features/merchants/components/VerificationQueue";

export default async function AdminMerchantsPage() {
  const [merchants, documents, t, tVerification] = await Promise.all([
    getAllMerchantsAction(),
    getPendingVerificationDocumentsAction(),
    getTranslations("merchants"),
    getTranslations("merchants.verification"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <MerchantQueue merchants={merchants} />
      <section className="space-y-4" aria-labelledby="verification-queue-heading">
        <div>
          <h2
            id="verification-queue-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {tVerification("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tVerification("subtitle")}
          </p>
        </div>
        <VerificationQueue documents={documents} />
      </section>
    </div>
  );
}

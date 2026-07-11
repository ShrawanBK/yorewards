import { getTranslations } from "next-intl/server";

export default async function MerchantTermsPage() {
  const t = await getTranslations("billing.termsPage");

  return (
    <main className="merchant-app-bg min-h-screen px-6 py-10">
      <article className="merchant-glass-card mx-auto max-w-2xl space-y-4 rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="merchant-body-muted text-sm">{t("updated")}</p>
        {(["section1", "section2", "section3"] as const).map((key) => (
          <section key={key} className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              {t(`${key}.title`)}
            </h2>
            <p className="merchant-body-muted text-sm leading-relaxed">
              {t(`${key}.body`)}
            </p>
          </section>
        ))}
      </article>
    </main>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PRIVACY_EMAIL } from "@/shared/constants/contact";

const SECTIONS = ["dataCollected", "hosting", "rights", "deletion"] as const;

export async function PrivacyView() {
  const t = await getTranslations("privacy");

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("updated")}</p>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </header>

      {SECTIONS.map((key) => (
        <section key={key} aria-labelledby={`privacy-${key}`}>
          <h2 id={`privacy-${key}`} className="text-lg font-semibold">
            {t(`${key}.title`)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t(`${key}.body`)}</p>
        </section>
      ))}

      <p className="text-sm">
        <a
          href={`mailto:${PRIVACY_EMAIL}`}
          className="font-medium text-brand-purple underline-offset-4 hover:underline"
        >
          {PRIVACY_EMAIL}
        </a>
      </p>

      <Link
        href="/profile"
        className="text-sm font-medium text-brand-purple underline-offset-4 hover:underline"
      >
        {t("backToProfile")}
      </Link>
    </article>
  );
}

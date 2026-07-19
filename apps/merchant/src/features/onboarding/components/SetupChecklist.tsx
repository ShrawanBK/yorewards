import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

export async function SetupChecklist({
  profileComplete,
  loyaltyCardConfigured,
  merchantActive,
}: {
  profileComplete: boolean;
  loyaltyCardConfigured: boolean;
  merchantActive: boolean;
}) {
  const t = await getTranslations("onboarding.checklist");

  const items = [
    {
      key: "profile",
      done: profileComplete,
      href: "/merchant/business",
      label: t("profile"),
    },
    {
      key: "card",
      done: loyaltyCardConfigured,
      href: "/merchant/loyalty-card",
      label: t("card"),
    },
    {
      key: "live",
      done: merchantActive,
      href: "/merchant/loyalty-card",
      label: t("qr"),
    },
  ] as const;

  const completed = items.filter((item) => item.done).length;
  if (completed === items.length) return null;

  return (
    <Card className="merchant-glass-card">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle", { done: completed, total: items.length })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
              ) : (
                <Circle className="size-4 text-muted-foreground" aria-hidden />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : undefined}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" size="sm" className="min-h-11">
          <Link href={items.find((item) => !item.done)?.href ?? "/merchant/dashboard"}>
            {t("cta")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

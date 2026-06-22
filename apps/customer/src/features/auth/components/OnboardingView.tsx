import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { CustomerOnboardingForm } from "./CustomerOnboardingForm";

export async function OnboardingView() {
  const t = await getTranslations("auth");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("onboarding.title")}</CardTitle>
        <CardDescription>{t("onboarding.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <CustomerOnboardingForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}

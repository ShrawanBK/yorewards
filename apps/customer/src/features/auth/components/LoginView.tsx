import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { CustomerLoginForm } from "./CustomerLoginForm";

export async function LoginView() {
  const t = await getTranslations("auth");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <CustomerLoginForm />
      </CardContent>
    </Card>
  );
}

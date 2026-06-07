import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

export default async function Home() {
  const t = await getTranslations("app");

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-surface p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-brand-purple hover:bg-brand-purple/90">
            {t("cta")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

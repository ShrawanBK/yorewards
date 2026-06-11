import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { AddBusinessForm } from "@/features/business/components/AddBusinessForm";

export async function AddBusinessView({ ownerEmail }: { ownerEmail: string }) {
  const t = await getTranslations("business");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/merchant/dashboard">{t("actions.back")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("formTitle")}</CardTitle>
          <CardDescription>{t("formSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AddBusinessForm ownerEmail={ownerEmail} />
        </CardContent>
      </Card>
    </div>
  );
}

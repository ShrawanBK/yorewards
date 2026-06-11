import type { MerchantStatus } from "@repo/supabase/types";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { CheckCircle2, Clock, ShieldAlert, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

const STATUS_STYLE: Record<
  MerchantStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    icon: typeof Clock;
  }
> = {
  pending: { variant: "secondary", icon: Clock },
  active: {
    variant: "default",
    className: "bg-brand-green text-white",
    icon: CheckCircle2,
  },
  rejected: { variant: "destructive", icon: XCircle },
  suspended: { variant: "outline", icon: ShieldAlert },
};

export async function MerchantStatusPanel({
  businessName,
  status,
  rejectionReason,
}: {
  businessName: string;
  status: MerchantStatus;
  rejectionReason: string | null;
}) {
  const t = await getTranslations("dashboard");
  const style = STATUS_STYLE[status];
  const Icon = style.icon;

  return (
    <Card className="border-brand-purple/20 bg-gradient-to-br from-brand-surface to-white">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{businessName}</CardTitle>
            <CardDescription>{t("accountStatus")}</CardDescription>
          </div>
          <Badge
            variant={style.variant}
            className={cn("shrink-0 capitalize", style.className)}
          >
            {t(`status.${status}.label`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 rounded-lg border bg-background/80 p-4">
          <Icon className="mt-0.5 size-5 shrink-0 text-brand-purple" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`status.${status}.description`)}
          </p>
        </div>
        {status === "rejected" && rejectionReason ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">
              {t("rejectionReason")}
            </p>
            <p className="mt-1 text-muted-foreground">{rejectionReason}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

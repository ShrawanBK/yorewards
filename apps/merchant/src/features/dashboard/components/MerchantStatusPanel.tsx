import Link from "next/link";
import type { MerchantStatus } from "@repo/supabase/types";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
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
import { MERCHANT_STATUS_BADGE } from "@/shared/constants/status-badges";

const STATUS_ICON: Record<MerchantStatus, typeof Clock> = {
  pending: Clock,
  pending_verification: Clock,
  active: CheckCircle2,
  rejected: XCircle,
  suspended: ShieldAlert,
};

export async function MerchantStatusPanel({
  businessName,
  status,
  rejectionReason,
  statusReason,
}: {
  businessName: string;
  status: MerchantStatus;
  rejectionReason: string | null;
  statusReason?: string | null;
}) {
  const t = await getTranslations("dashboard");
  const tVerify = await getTranslations("auth.verifyEmail");
  const badge = MERCHANT_STATUS_BADGE[status];
  const Icon = STATUS_ICON[status];

  const showConfigureCard =
    status === "pending" || status === "pending_verification";
  const showSettingsLink = status !== "active";
  const showEmailResend = status === "pending_verification";

  return (
    <Card className="merchant-glass-card overflow-hidden">
      <CardHeader className="space-y-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-semibold">
              {businessName}
            </CardTitle>
            <CardDescription className="merchant-body-muted">
              {t("accountStatus")}
            </CardDescription>
          </div>
          <Badge
            variant={badge.variant}
            className={cn("shrink-0 capitalize", badge.className)}
          >
            {t(`status.${status}.label`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <Icon
            className="mt-0.5 size-5 shrink-0 text-primary-dark dark:text-primary"
            aria-hidden
          />
          <p className="leading-relaxed merchant-body-muted">
            {t(`status.${status}.description`)}
          </p>
        </div>
        {status === "rejected" && rejectionReason ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/15 p-4 text-sm">
            <p className="font-medium text-destructive">
              {t("rejectionReason")}
            </p>
            <p className="mt-1 merchant-body-muted">{rejectionReason}</p>
          </div>
        ) : null}
        {status === "suspended" && statusReason ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/15 p-4 text-sm">
            <p className="font-medium text-destructive">
              {t("suspensionReason")}
            </p>
            <p className="mt-1 merchant-body-muted">{statusReason}</p>
          </div>
        ) : null}
        {showConfigureCard || showSettingsLink || showEmailResend ? (
          <div className="flex flex-wrap gap-2">
            {showEmailResend ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/merchant/verify-email">{tVerify("resend")}</Link>
              </Button>
            ) : null}
            {showConfigureCard ? (
              <Button asChild size="sm">
                <Link href="/merchant/loyalty-card">
                  {t("statusActions.configureCard")}
                </Link>
              </Button>
            ) : null}
            {showSettingsLink ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/merchant/settings">
                  {t("statusActions.viewSettings")}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

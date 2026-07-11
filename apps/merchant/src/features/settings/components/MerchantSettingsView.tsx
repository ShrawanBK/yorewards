import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Building2, Mail, MapPin } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { MERCHANT_STATUS_BADGE } from "@/shared/constants/status-badges";
import { ChangeEmailForm } from "@/features/account/components/ChangeEmailForm";
import { ChangePasswordForm } from "@/features/account/components/ChangePasswordForm";
import { VerificationUploadForm } from "@/features/verification";
import { SmartPromoSettingsForm } from "@/features/promotions/components/SmartPromoSettingsForm";
import {
  merchantCanUseSmartPromo,
  merchantCanUseVerifiedBadge,
} from "@repo/utils/plan-limits";

type MerchantSettingsViewProps = {
  email: string;
  merchant: MerchantRow;
  merchantCount: number;
  activeBranch: MerchantLocationRow | null;
  branchCount: number;
};

export async function MerchantSettingsView({
  email,
  merchant,
  merchantCount,
  activeBranch,
  branchCount,
}: MerchantSettingsViewProps) {
  const t = await getTranslations("settings");
  const tBusiness = await getTranslations("business");
  const statusBadge = MERCHANT_STATUS_BADGE[merchant.status];
  const privacyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/privacy`;
  const canVerify = merchantCanUseVerifiedBadge(merchant.subscription_tier);
  const canSmartPromo = merchantCanUseSmartPromo(merchant.subscription_tier);

  return (
    <div className="space-y-6">
      <Card className="merchant-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="size-5 text-primary" aria-hidden />
            {t("account.title")}
          </CardTitle>
          <CardDescription>{t("account.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <dl className="grid gap-1 text-sm">
            <dt className="text-muted-foreground">{t("account.emailLabel")}</dt>
            <dd className="font-medium">{email}</dd>
          </dl>
          <p className="text-sm merchant-body-muted">{t("account.signOutHint")}</p>
          <div className="space-y-6 border-t border-border pt-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("account.password.title")}</h3>
              <ChangePasswordForm />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("account.email.title")}</h3>
              <ChangeEmailForm currentEmail={email} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="merchant-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" aria-hidden />
            {t("business.title")}
          </CardTitle>
          <CardDescription>{t("business.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold">{merchant.business_name}</p>
              <p className="text-sm merchant-body-muted">
                {merchant.category} · {tBusiness(`countries.${merchant.country}`)}
              </p>
            </div>
            <Badge
              variant={statusBadge.variant}
              className={cn("capitalize", statusBadge.className)}
            >
              {tBusiness(`status.${merchant.status}`)}
            </Badge>
          </div>

          {merchantCount > 1 ? (
            <p className="text-sm merchant-body-muted">{t("business.switchHint")}</p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/business">
                {t("business.manageLink")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/loyalty-card">
                {t("business.loyaltyLink")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {canSmartPromo ? (
        <Card className="merchant-glass-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("promotions.title")}</CardTitle>
            <CardDescription>{t("promotions.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SmartPromoSettingsForm
              merchantId={merchant.id}
              enabled={merchant.smart_promo_enabled}
              threshold={merchant.smart_promo_threshold}
            />
          </CardContent>
        </Card>
      ) : null}

      {canVerify ? (
        <Card className="merchant-glass-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("verification.title")}</CardTitle>
            <CardDescription>{t("verification.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm merchant-body-muted">
              {t("verification.status", {
                status: merchant.verification_status,
              })}
            </p>
            <VerificationUploadForm merchantId={merchant.id} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="merchant-glass-card">
        <CardHeader>
          <CardTitle className="text-lg">{t("preferences.title")}</CardTitle>
          <CardDescription>{t("preferences.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("preferences.theme")}</p>
            <ThemeToggle className="w-full max-w-xs" />
          </div>

          {branchCount > 1 ? (
            <div className="space-y-2 border-t border-border pt-6">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="size-4 text-primary" aria-hidden />
                {t("preferences.branch")}
              </p>
              <p className="text-sm font-medium">
                {activeBranch?.name ?? t("preferences.branchUnknown")}
              </p>
              <p className="text-sm merchant-body-muted">
                {t("preferences.branchHint")}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="merchant-glass-card">
        <CardHeader>
          <CardTitle className="text-lg">{t("legal.title")}</CardTitle>
          <CardDescription>{t("legal.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
              {t("legal.privacy")}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

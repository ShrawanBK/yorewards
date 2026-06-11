"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import imageCompression from "browser-image-compression";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { LoyaltyCardRow } from "@repo/supabase/queries/loyalty-cards";
import type { CurrencyCode, RewardType } from "@repo/supabase/types";
import {
  saveLoyaltyCardConfigAction,
  uploadLoyaltyCardLogoAction,
} from "@/features/loyalty-card/api/loyaltyCardActions";
import { LoyaltyCardPreview } from "@/features/loyalty-card/components/LoyaltyCardPreview";

const PRESET_COLORS = [
  "#7C3AED",
  "#059669",
  "#DC2626",
  "#2563EB",
  "#D97706",
  "#DB2777",
  "#1E1B4B",
];

const REWARD_TYPES: RewardType[] = [
  "free_item",
  "percent_discount",
  "fixed_discount",
];

type LoyaltyCardConfigFormProps = {
  merchant: MerchantRow;
  loyaltyCard: LoyaltyCardRow | null;
  readOnly: boolean;
};

export function LoyaltyCardConfigForm({
  merchant,
  loyaltyCard,
  readOnly,
}: LoyaltyCardConfigFormProps) {
  const t = useTranslations("loyaltyCard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(merchant.logo_url);

  const [cardName, setCardName] = useState(
    loyaltyCard?.card_name ?? merchant.business_name,
  );
  const [description, setDescription] = useState(
    loyaltyCard?.description ?? t("defaults.description"),
  );
  const [primaryColor, setPrimaryColor] = useState(
    merchant.primary_color || "#7C3AED",
  );
  const [stampTarget, setStampTarget] = useState(
    String(loyaltyCard?.stamp_target ?? 10),
  );
  const [minSpend, setMinSpend] = useState(String(loyaltyCard?.min_spend ?? 0));
  const [rewardType, setRewardType] = useState<RewardType>(
    loyaltyCard?.reward_type ?? "free_item",
  );
  const [rewardValue, setRewardValue] = useState(loyaltyCard?.reward_value ?? "");
  const [rewardDescription, setRewardDescription] = useState(
    loyaltyCard?.reward_description ?? "",
  );

  const previewValues = useMemo(
    () => ({
      stampTarget: Number(stampTarget) || 10,
      minSpend: Number(minSpend) || 0,
      minSpendCurrency:
        (loyaltyCard?.min_spend_currency ??
          (merchant.country === "FI" ? "EUR" : "NPR")) as CurrencyCode,
    }),
    [stampTarget, minSpend, loyaltyCard?.min_spend_currency, merchant.country],
  );

  async function handleLogoChange(file: File | undefined) {
    if (!file || readOnly) return;
    setError(null);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const formData = new FormData();
      formData.set("logo", compressed);
      startTransition(async () => {
        const result = await uploadLoyaltyCardLogoAction(merchant.id, formData);
        if (result.error) setError(result.error);
        else if (result.logoUrl) {
          setLogoUrl(result.logoUrl);
          router.refresh();
        }
      });
    } catch {
      setError(t("errors.logoUpload"));
    }
  }

  function handleSave(formData: FormData) {
    if (readOnly) return;
    setError(null);
    formData.set("card_name", cardName);
    formData.set("description", description);
    formData.set("primary_color", primaryColor);
    formData.set("stamp_target", stampTarget);
    formData.set("min_spend", minSpend);
    formData.set("reward_type", rewardType);
    formData.set("reward_value", rewardValue);
    formData.set("reward_description", rewardDescription);

    startTransition(async () => {
      const result = await saveLoyaltyCardConfigAction(merchant.id, formData);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
      <div className="space-y-6">
        {readOnly ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {t("readOnlyNotice")}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("sections.identity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={t("fields.logo")} htmlFor="loyalty-card-logo">
              <Input
                id="loyalty-card-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={readOnly || isPending}
                onChange={(e) => handleLogoChange(e.target.files?.[0])}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("hints.logo")}
              </p>
            </Field>

            <Field label={t("fields.primaryColor")} htmlFor="loyalty-card-color">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setPrimaryColor(color)}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform",
                      primaryColor === color
                        ? "scale-110 border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={t("fields.primaryColor")}
                  />
                ))}
              </div>
              <Input
                id="loyalty-card-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={readOnly}
                className="mt-2 max-w-[8rem] font-mono text-sm"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </Field>

            <Field label={t("fields.cardName")} htmlFor="loyalty-card-name">
              <Input
                id="loyalty-card-name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                maxLength={40}
                disabled={readOnly}
              />
            </Field>

            <Field
              label={t("fields.description")}
              htmlFor="loyalty-card-description"
            >
              <Input
                id="loyalty-card-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
                disabled={readOnly}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("sections.rules")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("fields.stampTarget")}
              htmlFor="loyalty-card-stamp-target"
            >
              <Input
                id="loyalty-card-stamp-target"
                type="number"
                min={5}
                max={50}
                value={stampTarget}
                onChange={(e) => setStampTarget(e.target.value)}
                disabled={readOnly}
              />
            </Field>
            <Field
              label={t("fields.minSpend")}
              htmlFor="loyalty-card-min-spend"
            >
              <Input
                id="loyalty-card-min-spend"
                type="number"
                min={0}
                step="0.01"
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
                disabled={readOnly}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("hints.minSpend")}
              </p>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("sections.reward")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {REWARD_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={rewardType === type ? "default" : "outline"}
                  disabled={readOnly}
                  onClick={() => setRewardType(type)}
                >
                  {t(`rewardTypes.${type}`)}
                </Button>
              ))}
            </div>

            <Field
              label={t(`fields.rewardValue.${rewardType}`)}
              htmlFor="loyalty-card-reward-value"
            >
              <Input
                id="loyalty-card-reward-value"
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
                disabled={readOnly}
              />
            </Field>

            <Field
              label={t("fields.rewardDescription")}
              htmlFor="loyalty-card-reward-description"
            >
              <Input
                id="loyalty-card-reward-description"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                disabled={readOnly}
              />
            </Field>
          </CardContent>
        </Card>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!readOnly ? (
          <form action={handleSave}>
            <Button type="submit" disabled={isPending}>
              {t("actions.save")}
            </Button>
          </form>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-28">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {t("preview.label")}
        </p>
        <LoyaltyCardPreview
          businessName={merchant.business_name}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          cardName={cardName}
          description={description}
          stampTarget={previewValues.stampTarget}
          minSpend={previewValues.minSpend}
          minSpendCurrency={previewValues.minSpendCurrency}
          rewardType={rewardType}
          rewardDescription={
            rewardDescription || t("preview.rewardPlaceholder")
          }
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { updateSmartPromoSettingsAction } from "@/features/promotions/api/promotionActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function SmartPromoSettingsForm({
  merchantId,
  enabled,
  threshold,
}: {
  merchantId: string;
  enabled: boolean;
  threshold: number;
}) {
  const t = useTranslations("promotions");
  const tErrors = useTranslations("errors.actions");
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [stampsAway, setStampsAway] = useState(String(threshold));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);
        const fd = new FormData();
        fd.set("enabled", String(isEnabled));
        fd.set("threshold", stampsAway);
        const result = await updateSmartPromoSettingsAction(merchantId, fd);
        setPending(false);
        if (result.error) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        showActionSuccess(t, "success.saved");
      }}
    >
      <label className="flex items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={isEnabled}
          onChange={(event) => setIsEnabled(event.target.checked)}
          aria-label={t("fields.enabledAria")}
        />
        {t("fields.enabled")}
      </label>
      <Field label={t("fields.threshold")} htmlFor="smart_promo_threshold">
        <select
          id="smart_promo_threshold"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={stampsAway}
          onChange={(event) => setStampsAway(event.target.value)}
        >
          <option value="1">{t("thresholdOptions.one")}</option>
          <option value="2">{t("thresholdOptions.two")}</option>
          <option value="3">{t("thresholdOptions.three")}</option>
        </select>
      </Field>
      <p className="merchant-body-muted text-sm">{t("hint")}</p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}

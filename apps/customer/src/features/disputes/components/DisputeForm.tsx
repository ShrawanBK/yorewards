"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import { submitStampDisputeAction } from "@/features/disputes/api/disputeActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { toast } from "@repo/ui/sonner";

type DisputeFormProps = {
  customerCardId: string;
};

export function DisputeForm({
  customerCardId,
  onSubmitted,
}: DisputeFormProps & { onSubmitted?: () => void }) {
  const t = useTranslations("dispute");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await submitStampDisputeAction(new FormData(event.currentTarget));
    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    toast.success(t("success.submitted"));
    setDone(true);
    onSubmitted?.();
    router.refresh();
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {t("success.hint")}
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border/60 p-4"
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <input type="hidden" name="customerCardId" value={customerCardId} />
      <Field label={t("visitDate")} htmlFor="dispute-date">
        <Input
          id="dispute-date"
          name="visitDate"
          type="date"
          required
          className="min-h-11"
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>
      <Field label={t("amount")} htmlFor="dispute-amount">
        <Input
          id="dispute-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min={1}
          step="any"
          required
          className="min-h-11"
        />
      </Field>
      <Field label={t("description")} htmlFor="dispute-description">
        <textarea
          id="dispute-description"
          name="description"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder={t("descriptionPlaceholder")}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        className="min-h-11 w-full"
        disabled={pending}
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

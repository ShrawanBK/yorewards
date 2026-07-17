"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Field } from "@repo/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { submitStampDisputeAction } from "@/features/disputes/api/disputeActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { toast } from "@repo/ui/sonner";

type DisputeFormProps = {
  customerCardId: string;
  onSubmitted?: () => void;
};

export function DisputeForm({ customerCardId, onSubmitted }: DisputeFormProps) {
  const t = useTranslations("dispute");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setPending(false);
    } else {
      setFormKey((k) => k + 1);
      setError(null);
    }
  }

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
    handleOpenChange(false);
    onSubmitted?.();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11 w-full">
          {t("openForm")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="fixed inset-x-0 bottom-0 top-auto z-50 flex max-h-[min(92dvh,40rem)] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:max-h-[min(90dvh,40rem)] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border"
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <input type="hidden" name="customerCardId" value={customerCardId} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("visitDate")} htmlFor="dispute-date">
                <Input
                  id="dispute-date"
                  name="visitDate"
                  type="date"
                  required
                  className="min-h-11"
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={pending}
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
                  disabled={pending}
                />
              </Field>
            </div>
            <Field label={t("description")} htmlFor="dispute-description">
              <textarea
                id="dispute-description"
                name="description"
                required
                minLength={10}
                maxLength={500}
                rows={4}
                disabled={pending}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t("descriptionPlaceholder")}
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                disabled={pending}
              >
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="min-h-11 w-full sm:w-auto"
              disabled={pending}
            >
              {pending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

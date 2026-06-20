"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import {
  addBranchAction,
  updateBranchAction,
} from "@/features/business/api/locationActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

type BranchFormDialogProps = {
  merchantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: MerchantLocationRow | null;
};

export function BranchFormDialog({
  merchantId,
  open,
  onOpenChange,
  branch,
}: BranchFormDialogProps) {
  const t = useTranslations("branches");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(branch);

  useEffect(() => {
    if (open) setError(null);
  }, [open, branch?.id]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit && branch
        ? await updateBranchAction(merchantId, branch.id, formData)
        : await addBranchAction(merchantId, formData);

      if (result.error) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("form.editSubtitle") : t("form.addSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
        >
          <Field label={t("fields.name")} htmlFor="branch-name">
            <Input
              id="branch-name"
              name="name"
              defaultValue={branch?.name ?? ""}
              placeholder={t("placeholders.name")}
              required
              maxLength={80}
              disabled={isPending}
            />
          </Field>
          <Field label={t("fields.address")} htmlFor="branch-address">
            <Input
              id="branch-address"
              name="address"
              defaultValue={branch?.address ?? ""}
              placeholder={t("placeholders.address")}
              disabled={isPending}
            />
          </Field>
          <Field label={t("fields.city")} htmlFor="branch-city">
            <Input
              id="branch-city"
              name="city"
              defaultValue={branch?.city ?? ""}
              placeholder={t("placeholders.city")}
              disabled={isPending}
            />
          </Field>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? t("actions.save") : t("actions.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

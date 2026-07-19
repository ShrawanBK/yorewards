"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { uploadVerificationDocumentAction } from "@/features/verification/api/verificationActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

export function VerificationUploadForm({ merchantId }: { merchantId: string }) {
  const t = useTranslations("verification");
  const tErrors = useTranslations("errors.actions");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError(null);
        setPending(true);
        const fd = new FormData(form);
        const result = await uploadVerificationDocumentAction(merchantId, fd);
        setPending(false);
        if (result.error) {
          setError(resolveActionError(tErrors, result.error));
          return;
        }
        showActionSuccess(t, "success.submitted");
        form.reset();
      }}
    >
      <Field label={t("fields.documentType")} htmlFor="document_type">
        <select
          id="document_type"
          name="document_type"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue="registration"
        >
          <option value="registration">{t("documentTypes.registration")}</option>
          <option value="pan">{t("documentTypes.pan")}</option>
          <option value="business_license">{t("documentTypes.businessLicense")}</option>
          <option value="other">{t("documentTypes.other")}</option>
        </select>
      </Field>
      <Field label={t("fields.file")} htmlFor="verification_file">
        <input
          id="verification_file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("actions.submitting") : t("actions.submit")}
      </Button>
    </form>
  );
}

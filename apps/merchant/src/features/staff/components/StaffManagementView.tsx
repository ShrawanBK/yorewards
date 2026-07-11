"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Field } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import type { MerchantStaffRow } from "@repo/supabase/queries/merchant-staff";
import {
  inviteStaffAction,
  removeStaffAction,
  resendStaffInviteAction,
} from "@/features/staff/api/staffActions";
import { isActionFailure, type ActionSuccess } from "@/shared/types/action-result";
import { resolveActionError, resolveActionWarning } from "@/shared/utils/resolve-action-error";
import { showActionSuccess, showActionWarning } from "@/shared/utils/action-feedback";

export function StaffManagementView({
  merchantId,
  staff,
}: {
  merchantId: string;
  staff: MerchantStaffRow[];
}) {
  const t = useTranslations("staff");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [resendingId, setResendingId] = useState<string | null>(null);

  function showInviteResult(result: ActionSuccess) {
    if (result.warning) {
      showActionWarning(resolveActionWarning(tErrors, result.warning));
      showActionSuccess(t, "inviteSaved");
      return;
    }
    showActionSuccess(t, "inviteSuccess");
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    const formData = new FormData(form);
    const result = await inviteStaffAction(merchantId, formData);
    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    showInviteResult(result);
    form.reset();
    router.refresh();
  }

  async function handleResend(staffId: string) {
    setResendingId(staffId);
    setError(null);
    const result = await resendStaffInviteAction(merchantId, staffId);
    setResendingId(null);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    if (result.warning) {
      showActionWarning(resolveActionWarning(tErrors, result.warning));
      return;
    }
    showActionSuccess(t, "resendSuccess");
  }

  async function handleRemove(staffId: string) {
    const result = await removeStaffAction(merchantId, staffId);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    showActionSuccess(t, "removeSuccess");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleInvite} className="merchant-glass-card space-y-4 rounded-xl border border-border p-4">
        <h2 className="text-lg font-semibold">{t("inviteTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("emailLabel")} htmlFor="staff-email">
            <Input id="staff-email" name="email" type="email" required className="min-h-11" />
          </Field>
          <Field label={t("nameLabel")} htmlFor="staff-name">
            <Input id="staff-name" name="displayName" className="min-h-11" />
          </Field>
          <Field label={t("roleLabel")} htmlFor="staff-role">
            <select
              id="staff-role"
              name="role"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue="cashier"
            >
              <option value="cashier">{t("roles.cashier")}</option>
              <option value="manager">{t("roles.manager")}</option>
            </select>
          </Field>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? t("inviting") : t("inviteCta")}
        </Button>
      </form>

      <section className="space-y-3" aria-labelledby="staff-list-heading">
        <h2 id="staff-list-heading" className="text-lg font-semibold">
          {t("listTitle")}
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {staff.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {member.display_name ?? member.invited_email}
                </p>
                <p className="text-sm merchant-body-muted">
                  {member.invited_email} · {t(`roles.${member.role}`)} ·{" "}
                  {t(`status.${member.status}`)}
                </p>
              </div>
              {member.role !== "owner" ? (
                <div className="flex flex-wrap gap-2">
                  {member.status === "pending" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      disabled={resendingId === member.id}
                      onClick={() => handleResend(member.id)}
                    >
                      {resendingId === member.id ? t("resending") : t("resend")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => handleRemove(member.id)}
                  >
                    {t("remove")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import type { MerchantStaffRow } from "@repo/supabase/queries/merchant-staff";
import {
  clearActingStaffAction,
  switchStaffByPinAction,
} from "@/features/staff/api/staffActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export function StaffSwitcher({
  merchantId,
  staff,
  actingStaffUserId,
}: {
  merchantId: string;
  staff: MerchantStaffRow[];
  actingStaffUserId: string | null;
}) {
  const t = useTranslations("staff.switcher");
  const tErrors = useTranslations("errors.actions");
  const router = useRouter();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const activeStaff = staff.find((member) => member.user_id === actingStaffUserId);
  const switchable = staff.filter(
    (member) => member.status === "active" && member.user_id && member.role !== "owner",
  );

  if (switchable.length === 0) return null;

  async function handleSwitch() {
    setPending(true);
    setError(null);
    const result = await switchStaffByPinAction(merchantId, selectedStaffId, pin);
    setPending(false);
    if (isActionFailure(result)) {
      setError(resolveActionError(tErrors, result.error));
      return;
    }
    setPin("");
    router.refresh();
  }

  async function handleClear() {
    await clearActingStaffAction();
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <p className="font-medium">{t("title")}</p>
      <p className="merchant-body-muted mt-1">
        {activeStaff
          ? t("active", { name: activeStaff.display_name ?? activeStaff.invited_email })
          : t("none")}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="sr-only" htmlFor="staff-switch-select">
          {t("selectLabel")}
        </label>
        <select
          id="staff-switch-select"
          value={selectedStaffId}
          onChange={(event) => setSelectedStaffId(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3"
        >
          <option value="">{t("selectPlaceholder")}</option>
          {switchable.map((member) => (
            <option key={member.id} value={member.user_id!}>
              {member.display_name ?? member.invited_email}
            </option>
          ))}
        </select>
        <Input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder={t("pinPlaceholder")}
          aria-label={t("pinAria")}
          className="h-11 w-28"
        />
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          disabled={pending || !selectedStaffId || pin.length < 4}
          onClick={handleSwitch}
        >
          {pending ? t("switching") : t("switch")}
        </Button>
        {actingStaffUserId ? (
          <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={handleClear}>
            {t("clear")}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Textarea } from "@repo/ui/textarea";
import type {
  MerchantCustomerDetail,
  CustomerSegment,
} from "@repo/supabase/queries/merchant-customers";
import {
  fetchCustomerDetailAction,
  saveCustomerNoteAction,
} from "@/features/customers/api/customerActions";
import { formatSpend, maskPhone } from "@/features/customers/utils/format";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionSuccess } from "@/shared/utils/action-feedback";

const SEGMENT_CLASS: Record<CustomerSegment, string> = {
  vip: "border-amber-500/55 bg-amber-950/45 text-amber-100",
  regular: "border-border bg-muted text-foreground",
  at_risk: "border-orange-500/55 bg-orange-950/40 text-orange-100",
  new: "border-sky-500/55 bg-sky-950/40 text-sky-100",
  lapsed: "border-border bg-muted/60 text-muted-foreground",
};

export function CustomerDetailDrawer({
  merchantId,
  customerId,
  open,
  onOpenChange,
}: {
  merchantId: string;
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("customers");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();
  const [detail, setDetail] = useState<MerchantCustomerDetail | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (!open || !customerId) {
      setDetail(null);
      setNote("");
      setError(null);
      return;
    }

    startLoad(async () => {
      const result = await fetchCustomerDetailAction(merchantId, customerId);
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      setDetail(result.detail);
      setNote(result.detail.note);
      setError(null);
    });
  }, [open, customerId, merchantId, tErrors]);

  function handleSaveNote() {
    if (!customerId) return;
    startSave(async () => {
      const result = await saveCustomerNoteAction(merchantId, customerId, note);
      if (isActionFailure(result)) {
        setError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(t, "success.noteSaved");
      setError(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l p-0 sm:max-w-lg">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              {detail?.customerName?.split(" ")[0] ?? t("unknownCustomer")}
            </DialogTitle>
            <DialogDescription>
              {detail ? maskPhone(detail.phone) : t("drawer.loading")}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="merchant-body-muted text-sm">{t("drawer.loading")}</p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {detail ? (
            <>
              <Badge
                variant="outline"
                className={SEGMENT_CLASS[detail.segment]}
              >
                {t(`segments.${detail.segment}`)}
              </Badge>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="merchant-body-muted">{t("drawer.totalSpend")}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatSpend(detail.totalSpend, detail.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="merchant-body-muted">{t("drawer.visits")}</dt>
                  <dd className="font-medium tabular-nums">{detail.visitCount}</dd>
                </div>
                <div>
                  <dt className="merchant-body-muted">{t("drawer.avgSpend")}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatSpend(detail.averageSpend, detail.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="merchant-body-muted">{t("drawer.lastVisit")}</dt>
                  <dd className="font-medium">
                    {detail.lastVisitAt
                      ? format.relativeTime(new Date(detail.lastVisitAt), Date.now())
                      : t("never")}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("drawer.stampHistory")}</h3>
                {detail.visits.length === 0 ? (
                  <p className="merchant-body-muted text-sm">{t("drawer.noVisits")}</p>
                ) : (
                  <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                    {detail.visits.map((visit) => (
                      <li
                        key={visit.id}
                        className="flex justify-between gap-2 border-b border-border/60 pb-2"
                      >
                        <span className="text-muted-foreground">
                          <time dateTime={visit.stampedAt}>
                            {format.dateTime(new Date(visit.stampedAt), {
                              dateStyle: "medium",
                            })}
                          </time>
                          {visit.branchName ? ` · ${visit.branchName}` : null}
                        </span>
                        <span className="tabular-nums">
                          {formatSpend(visit.amountSpent, detail.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t("drawer.rewardHistory")}</h3>
                {detail.rewards.length === 0 ? (
                  <p className="merchant-body-muted text-sm">{t("drawer.noRewards")}</p>
                ) : (
                  <ul className="max-h-32 space-y-2 overflow-y-auto text-sm">
                    {detail.rewards.map((reward) => (
                      <li key={reward.id} className="border-b border-border/60 pb-2">
                        <p className="font-medium">{reward.rewardDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          {reward.status === "redeemed"
                            ? t("drawer.rewardRedeemed")
                            : t("drawer.rewardPending")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="customer-note" className="text-sm font-medium">
                  {t("drawer.notes")}
                </label>
                <Textarea
                  id="customer-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={t("drawer.notesPlaceholder")}
                />
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={saving}
                  onClick={handleSaveNote}
                >
                  {saving ? t("drawer.savingNote") : t("drawer.saveNote")}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Search, Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import type { AdminCustomerListRow } from "@repo/supabase/queries/admin-customers";
import type { CustomerStatus } from "@repo/supabase/types";
import {
  reactivateCustomerAction,
  suspendCustomerAction,
  type CustomerActionResult,
} from "@/features/customers/api/customerActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionError, showActionSuccess } from "@/shared/utils/action-feedback";

const STATUS_BADGE: Record<
  CustomerStatus,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "destructive" },
};

type ConfirmAction = "suspend" | "reactivate";

export function AdminCustomersView({
  customers,
}: {
  customers: AdminCustomerListRow[];
}) {
  const t = useTranslations("customers");
  const [query, setQuery] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{
    customer: AdminCustomerListRow;
    action: ConfirmAction;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() ?? "";
      return name.includes(q) || customer.phone.includes(q);
    });
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="admin-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <p className="font-medium">{t("empty.title")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.phone")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.cards")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.joined")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onConfirm={(action) =>
                      setConfirmTarget({ customer, action })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {confirmTarget ? (
        <CustomerConfirmDialog
          customer={confirmTarget.customer}
          action={confirmTarget.action}
          onClose={() => setConfirmTarget(null)}
        />
      ) : null}
    </div>
  );
}

function CustomerRow({
  customer,
  onConfirm,
}: {
  customer: AdminCustomerListRow;
  onConfirm: (action: ConfirmAction) => void;
}) {
  const t = useTranslations("customers");
  const format = useFormatter();
  const badge = STATUS_BADGE[customer.status];
  const displayName = customer.name?.trim() || t("unnamed");

  return (
    <tr>
      <td className="px-4 py-3 font-medium">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="hover:text-primary hover:underline"
        >
          {displayName}
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
      <td className="px-4 py-3 tabular-nums">{customer.cardCount}</td>
      <td className="px-4 py-3">
        <Badge variant={badge.variant} className={badge.className}>
          {t(`status.${customer.status}`)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {format.dateTime(new Date(customer.createdAt), { dateStyle: "medium" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {customer.status === "active" ? (
            <Button
              type="button"
              size="sm"
              className="admin-btn-destructive"
              onClick={() => onConfirm("suspend")}
            >
              {t("actions.suspend")}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="admin-btn-success"
              onClick={() => onConfirm("reactivate")}
            >
              {t("actions.reactivate")}
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="admin-btn-outline gap-1">
            <Link href={`/admin/customers/${customer.id}`}>
              {t("actions.view")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function CustomerConfirmDialog({
  customer,
  action,
  onClose,
}: {
  customer: AdminCustomerListRow;
  action: ConfirmAction;
  onClose: () => void;
}) {
  const t = useTranslations("customers");
  const tErrors = useTranslations("errors.actions");
  const [isPending, startTransition] = useTransition();
  const displayName = customer.name?.trim() || customer.phone;

  function runAction(actionFn: () => Promise<CustomerActionResult>) {
    startTransition(async () => {
      const result = await actionFn();
      if (result?.error) {
        showActionError(resolveActionError(tErrors, result.error));
        return;
      }
      showActionSuccess(
        t,
        action === "suspend" ? "success.suspended" : "success.reactivated",
        { name: displayName },
      );
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "suspend"
              ? t("confirm.suspendTitle")
              : t("confirm.reactivateTitle")}
          </DialogTitle>
          <DialogDescription>
            {action === "suspend"
              ? t("confirm.suspendDescription", { name: displayName })
              : t("confirm.reactivateDescription", { name: displayName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="admin-btn-outline" disabled={isPending} onClick={onClose}>
            {t("confirm.cancel")}
          </Button>
          <Button
            type="button"
            className={
              action === "reactivate" ? "admin-btn-success" : "admin-btn-destructive"
            }
            disabled={isPending}
            onClick={() =>
              runAction(() =>
                action === "suspend"
                  ? suspendCustomerAction(customer.id)
                  : reactivateCustomerAction(customer.id),
              )
            }
          >
            {action === "suspend" ? t("actions.suspend") : t("actions.reactivate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

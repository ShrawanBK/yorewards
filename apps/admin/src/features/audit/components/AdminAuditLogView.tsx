"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import {
  formatAuditAdminLabel,
  type AdminAuditLogEntry,
  type AuditLogFilter,
  type AuditLogPage,
} from "@repo/supabase/queries/admin-audit";
import { getAuditLogAction } from "@/features/audit/api/auditActions";

const FILTERS: AuditLogFilter[] = ["all", "merchant", "customer", "stamp"];
const PAGE_SIZE = 25;

function targetHref(entry: AdminAuditLogEntry): string | null {
  if (entry.targetType === "merchant") {
    return `/admin/merchants/${entry.targetId}`;
  }
  if (entry.targetType === "customer") {
    return `/admin/customers/${entry.targetId}`;
  }
  return null;
}

function AuditLogRow({ entry }: { entry: AdminAuditLogEntry }) {
  const tActions = useTranslations("audit.actions");
  const tTargets = useTranslations("audit.targetTypes");
  const format = useFormatter();

  let actionLabel = entry.action;
  try {
    actionLabel = tActions(entry.action);
  } catch {
    // Unknown action — show raw code until i18n key is added
  }

  const href = targetHref(entry);
  const adminLabel = formatAuditAdminLabel(entry.adminEmail, entry.adminId);

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        <time dateTime={entry.occurredAt}>
          {format.dateTime(new Date(entry.occurredAt), {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </td>
      <td className="px-4 py-3 font-medium">{actionLabel}</td>
      <td className="px-4 py-3 text-muted-foreground">{adminLabel}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{tTargets(entry.targetType)}</Badge>
          {href ? (
            <Link
              href={href}
              className="font-mono text-xs text-primary hover:underline"
            >
              {entry.targetId.slice(0, 8)}…
            </Link>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              {entry.targetId.slice(0, 8)}…
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground max-w-xs">
        {entry.notes ?? "—"}
      </td>
    </tr>
  );
}

export function AdminAuditLogView({
  initialPage,
}: {
  initialPage: AuditLogPage;
}) {
  const t = useTranslations("audit");
  const [filter, setFilter] = useState<AuditLogFilter>("all");
  const [entries, setEntries] = useState(initialPage.entries);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [isPending, startTransition] = useTransition();

  function loadPage(nextFilter: AuditLogFilter, offset: number, append: boolean) {
    startTransition(async () => {
      const page = await getAuditLogAction({
        limit: PAGE_SIZE,
        offset,
        filter: nextFilter,
      });
      setEntries((prev) => (append ? [...prev, ...page.entries] : page.entries));
      setHasMore(page.hasMore);
      setFilter(nextFilter);
    });
  }

  function handleFilterChange(next: AuditLogFilter) {
    if (next === filter && entries.length > 0) return;
    loadPage(next, 0, false);
  }

  function handleLoadMore() {
    loadPage(filter, entries.length, true);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("filters.label")}>
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => handleFilterChange(value)}
            disabled={isPending}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`filters.${value}`)}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <Card className="admin-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="size-6 text-muted-foreground" aria-hidden />
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.time")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.action")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.admin")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.target")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <AuditLogRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
          {hasMore ? (
            <div className="border-t border-border p-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadMore}
                disabled={isPending}
              >
                {isPending ? t("loadMore.pending") : t("loadMore.label")}
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

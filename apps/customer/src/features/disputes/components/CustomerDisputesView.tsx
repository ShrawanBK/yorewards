"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import type { CustomerStampDisputeItem } from "@repo/supabase/queries/stamp-disputes-shared";
import { listCustomerDisputesAction } from "@/features/disputes/api/disputeActions";
import { CustomerDisputeCard } from "@/features/disputes/components/CustomerDisputesPanel";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

function DisputeSection({
  items,
  emptyLabel,
}: {
  items: CustomerStampDisputeItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((dispute) => (
        <li key={dispute.id}>
          <CustomerDisputeCard dispute={dispute} showMerchant />
        </li>
      ))}
    </ul>
  );
}

export function CustomerDisputesView() {
  const t = useTranslations("dispute");
  const tErrors = useTranslations("errors.actions");

  const { data: disputes = [], isLoading, isError, error } = useQuery({
    queryKey: ["customer-disputes"],
    queryFn: async () => {
      const result = await listCustomerDisputesAction();
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      return result.disputes;
    },
  });

  const grouped = useMemo(() => {
    const pending: CustomerStampDisputeItem[] = [];
    const approved: CustomerStampDisputeItem[] = [];
    const rejected: CustomerStampDisputeItem[] = [];
    for (const item of disputes) {
      if (item.status === "pending") pending.push(item);
      else if (item.status === "approved") approved.push(item);
      else rejected.push(item);
    }
    return { pending, approved, rejected };
  }, [disputes]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 pb-8 sm:px-6">
      <Button variant="ghost" className="min-h-11 w-fit justify-start px-0" asChild>
        <Link href="/profile">
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {t("list.back")}
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">{t("list.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("list.subtitle")}</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {(error as Error)?.message ?? tErrors("DISPUTE_SUBMIT_FAILED")}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        disputes.length === 0 ? (
          <div className="space-y-1 rounded-xl border border-border/60 px-4 py-10 text-center">
            <p className="font-medium">{t("list.emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("list.emptyDescription")}</p>
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
              <TabsTrigger
                value="pending"
                className="min-h-10 px-1 text-xs sm:px-3 sm:text-sm"
              >
                {t("list.tabs.pending")}
                {grouped.pending.length > 0 ? (
                  <span className="ml-1 text-xs opacity-70">
                    ({grouped.pending.length})
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="min-h-10 px-1 text-xs sm:px-3 sm:text-sm"
              >
                {t("list.tabs.approved")}
                {grouped.approved.length > 0 ? (
                  <span className="ml-1 text-xs opacity-70">
                    ({grouped.approved.length})
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="min-h-10 px-1 text-xs sm:px-3 sm:text-sm"
              >
                {t("list.tabs.rejected")}
                {grouped.rejected.length > 0 ? (
                  <span className="ml-1 text-xs opacity-70">
                    ({grouped.rejected.length})
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <DisputeSection
                items={grouped.pending}
                emptyLabel={t("list.emptyPending")}
              />
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <DisputeSection
                items={grouped.approved}
                emptyLabel={t("list.emptyApproved")}
              />
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
              <DisputeSection
                items={grouped.rejected}
                emptyLabel={t("list.emptyRejected")}
              />
            </TabsContent>
          </Tabs>
        )
      ) : null}
    </div>
  );
}

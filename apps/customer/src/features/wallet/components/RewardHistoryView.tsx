"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Skeleton } from "@repo/ui/skeleton";
import { useAuthStore } from "@/features/auth";
import { useQuery } from "@tanstack/react-query";
import { fetchRewardHistoryAction } from "@/features/wallet/api/cardActions";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { isActionFailure } from "@/shared/types/action-result";
import { ArrowLeft } from "lucide-react";

export function RewardHistoryView() {
  const t = useTranslations("rewardHistory");
  const tErrors = useTranslations("errors.actions");
  const customerId = useAuthStore((s) => s.customerId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reward-history", customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      const result = await fetchRewardHistoryAction();
      if (isActionFailure(result)) throw new Error(result.error.code);
      return result.items;
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 p-6 pb-8">
      <Button variant="ghost" className="min-h-11 w-fit justify-start px-0" asChild>
        <Link href="/wallet">
          <ArrowLeft className="mr-2 size-4" aria-hidden />
          {t("back")}
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {resolveActionError(tErrors, {
            code: (error as Error).message as "WALLET_LOAD_FAILED",
          })}
        </p>
      ) : null}

      {data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}

      <ul className="space-y-3">
        {data?.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border/60 bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{item.businessName}</p>
                <p className="text-sm text-muted-foreground">{item.cardName}</p>
              </div>
              <span className="shrink-0 text-xs font-medium uppercase text-muted-foreground">
                {t(`status.${item.status}`)}
              </span>
            </div>
            <p className="mt-2 text-sm">{item.detail}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(item.occurredAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

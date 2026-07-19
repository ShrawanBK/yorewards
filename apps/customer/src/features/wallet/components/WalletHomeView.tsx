"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Gift, History, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Skeleton } from "@repo/ui/skeleton";
import { useAuthStore } from "@/features/auth";
import { useCustomerWallet } from "@/features/wallet/hooks/useCustomerWallet";
import { WalletCardTile } from "@/features/wallet/components/WalletCardTile";
import type { CustomerWalletCard } from "@/features/wallet/types/wallet.types";

function isRewardReady(status: CustomerWalletCard["rewardStatus"]): boolean {
  return status === "pending_otp" || status === "unlocked";
}

type SortMode = "recent" | "rewardReady";

export function WalletHomeView() {
  const t = useTranslations("wallet");
  const customerId = useAuthStore((s) => s.customerId);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const {
    data: cards,
    isError,
    refetch,
  } = useCustomerWallet(customerId);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setReady(false);
      return;
    }

    let cancelled = false;
    setReady(false);
    void refetch().finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [customerId, refetch]);

  const filtered = useMemo(() => {
    if (!cards) return [];
    const q = query.trim().toLowerCase();
    let list = cards;
    if (q) {
      list = list.filter(
        (c) =>
          c.businessName.toLowerCase().includes(q) ||
          c.cardName.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "rewardReady") {
        const ar = isRewardReady(a.rewardStatus) ? 1 : 0;
        const br = isRewardReady(b.rewardStatus) ? 1 : 0;
        if (br !== ar) return br - ar;
      }
      const at = a.lastStampedAt ? new Date(a.lastStampedAt).getTime() : 0;
      const bt = b.lastStampedAt ? new Date(b.lastStampedAt).getTime() : 0;
      return bt - at;
    });
  }, [cards, query, sort]);

  const rewardReadyCards =
    cards?.filter((c) => isRewardReady(c.rewardStatus)) ?? [];

  const waitingForData = isAuthLoading || !customerId || !ready;

  if (waitingForData) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-destructive" role="alert">
          {t("loadError")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-fit"
          onClick={() => void refetch()}
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!cards?.length) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
          <ScanLine className="size-8" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{t("empty.title")}</h1>
          <p className="text-muted-foreground">{t("empty.description")}</p>
        </div>
        <Button
          asChild
          className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
        >
          <Link href="/scan">{t("empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link href="/insights">
              <BarChart3 className="mr-2 size-4" aria-hidden />
              {t("insights")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link href="/wallet/rewards">
              <History className="mr-2 size-4" aria-hidden />
              {t("rewardHistory")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="min-h-11 flex-1"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          aria-label={t("sortAria")}
          className="h-11 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="recent">{t("sortRecent")}</option>
          <option value="rewardReady">{t("sortRewardReady")}</option>
        </select>
      </div>

      {rewardReadyCards.length > 0 ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4"
          role="status"
        >
          <Gift
            className="mt-0.5 size-5 shrink-0 text-brand-amber"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="font-medium">{t("banner.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("banner.description")}
            </p>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((card) => (
            <WalletCardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

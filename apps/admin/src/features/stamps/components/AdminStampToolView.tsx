"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Search, Stamp, TriangleAlert } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import type { AdminStampCardLookup } from "@repo/supabase/queries/admin-stamps";
import type { RewardStatus } from "@repo/supabase/types";
import {
  issueStampManualAction,
  lookupStampCardsAction,
  voidStampAction,
  type StampActionResult,
} from "@/features/stamps/api/stampActions";
import { isActionFailure } from "@/shared/types/action-result";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionError, showActionSuccess } from "@/shared/utils/action-feedback";

const REWARD_BADGE: Record<
  RewardStatus,
  { variant: "default" | "secondary" | "outline"; className?: string }
> = {
  collecting: { variant: "secondary" },
  pending_otp: { variant: "outline", className: "border-amber-500 text-amber-700" },
  unlocked: { variant: "default", className: "bg-brand-green text-white" },
};

function formatSource(t: ReturnType<typeof useTranslations>, source: string) {
  if (source === "admin_manual") return t("sessions.sourceAdmin");
  if (source === "qr_scan") return t("sessions.sourceQr");
  return source;
}

export function AdminStampToolView() {
  const t = useTranslations("stamps");
  const tErrors = useTranslations("errors.actions");
  const format = useFormatter();

  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [cards, setCards] = useState<AdminStampCardLookup[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [voidTarget, setVoidTarget] = useState<{
    sessionId: string;
    card: AdminStampCardLookup;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard =
    cards.find((card) => card.customerCardId === selectedCardId) ?? cards[0] ?? null;

  function handleActionResult(result: StampActionResult, successKey: string) {
    if (isActionFailure(result)) {
      showActionError(resolveActionError(tErrors, result.error));
      return;
    }
    if (result.card) {
      setCards((prev) =>
        prev.map((c) =>
          c.customerCardId === result.card!.customerCardId ? result.card! : c,
        ),
      );
      setSelectedCardId(result.card.customerCardId);
    }
    showActionSuccess(t, successKey, {
      name: result.card?.customerName ?? result.card?.phone ?? "Customer",
      merchant: result.card?.merchantName ?? "",
    });
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await lookupStampCardsAction(searchQuery);
      if ("error" in result) {
        showActionError(resolveActionError(tErrors, result.error));
        return;
      }
      setSearched(true);
      setCards(result.cards);
      setSelectedCardId(result.cards[0]?.customerCardId ?? null);
    });
  }

  function handleIssue(cardId: string) {
    startTransition(async () => {
      const result = await issueStampManualAction(cardId, notes);
      handleActionResult(result, "success.issued");
    });
  }

  function handleVoidConfirm() {
    if (!voidTarget) return;
    const { sessionId } = voidTarget;
    startTransition(async () => {
      const result = await voidStampAction(sessionId, notes);
      setVoidTarget(null);
      handleActionResult(result, "success.voided");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Card className="admin-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("search.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("search.placeholder")}
                className="pl-9"
                aria-label={t("search.placeholder")}
                disabled={isPending}
              />
            </div>
            <Button type="submit" disabled={isPending || !searchQuery.trim()}>
              {t("search.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && cards.length === 0 ? (
        <Card className="admin-card">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Stamp className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <p className="font-medium">{t("empty.title")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {cards.length > 1 ? (
        <Card className="admin-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("picker.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cards.map((card) => (
              <button
                key={card.customerCardId}
                type="button"
                onClick={() => setSelectedCardId(card.customerCardId)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selectedCard?.customerCardId === card.customerCardId
                    ? "border-brand-green bg-brand-green/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span>
                  <span className="font-medium">{card.merchantName}</span>
                  <span className="text-muted-foreground"> · {card.cardName}</span>
                </span>
                <span className="text-muted-foreground">
                  {t("progress", {
                    current: card.currentStamps,
                    target: card.stampTarget,
                  })}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {selectedCard ? (
        <Card className="admin-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("card.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">{t("card.customer")}</dt>
                <dd className="font-medium">
                  {selectedCard.customerName ?? t("card.unnamed")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("card.phone")}</dt>
                <dd className="font-medium">{selectedCard.phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("card.merchant")}</dt>
                <dd className="font-medium">{selectedCard.merchantName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("card.loyaltyCard")}</dt>
                <dd className="font-medium">{selectedCard.cardName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("card.progress")}</dt>
                <dd className="font-medium">
                  {t("progress", {
                    current: selectedCard.currentStamps,
                    target: selectedCard.stampTarget,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("card.rewardStatus")}</dt>
                <dd>
                  <Badge
                    variant={REWARD_BADGE[selectedCard.rewardStatus].variant}
                    className={REWARD_BADGE[selectedCard.rewardStatus].className}
                  >
                    {t(`rewardStatus.${selectedCard.rewardStatus}`)}
                  </Badge>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">{t("card.cardId")}</dt>
                <dd className="font-mono text-xs">{selectedCard.customerCardId}</dd>
              </div>
            </dl>

            <div className="space-y-2">
              <Label htmlFor="stamp-notes">{t("notes.label")}</Label>
              <Input
                id="stamp-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("notes.placeholder")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleIssue(selectedCard.customerCardId)}
                disabled={isPending}
              >
                {t("actions.issue")}
              </Button>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">{t("sessions.title")}</h3>
              {selectedCard.recentApprovedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("sessions.empty")}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        <th className="px-4 py-2 font-medium">{t("sessions.date")}</th>
                        <th className="px-4 py-2 font-medium">{t("sessions.source")}</th>
                        <th className="px-4 py-2 font-medium">{t("sessions.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedCard.recentApprovedSessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-4 py-2 text-muted-foreground">
                            {format.dateTime(new Date(session.createdAt), {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-4 py-2">
                            {formatSource(t, session.source)}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending}
                              onClick={() =>
                                setVoidTarget({
                                  sessionId: session.id,
                                  card: selectedCard,
                                })
                              }
                            >
                              {t("actions.void")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={voidTarget !== null} onOpenChange={() => setVoidTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-destructive" aria-hidden />
              {t("confirm.voidTitle")}
            </DialogTitle>
            <DialogDescription>{t("confirm.voidDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVoidTarget(null)}
              disabled={isPending}
            >
              {t("confirm.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleVoidConfirm}
              disabled={isPending}
            >
              {t("actions.voidConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

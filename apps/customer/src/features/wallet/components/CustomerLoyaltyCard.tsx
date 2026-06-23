"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatEUR, formatNPR } from "@repo/utils/currency";
import type { CurrencyCode } from "@repo/supabase/types";
import { CardProgressBar } from "@/features/wallet/components/CardProgressBar";
import { CardStampGrid } from "@/features/wallet/components/CardStampGrid";
import type { CustomerCardDetail } from "@/features/wallet/types/card-detail.types";
import { computeStampGridLayout } from "@/features/wallet/utils/stampGridLayout";

const CARD_HORIZONTAL_PADDING = 32;

function formatMinSpend(amount: number, currency: CurrencyCode) {
  if (amount <= 0) return null;
  return currency === "EUR" ? formatEUR(amount) : formatNPR(amount);
}

type CustomerLoyaltyCardProps = {
  card: CustomerCardDetail;
};

export function CustomerLoyaltyCard({ card }: CustomerLoyaltyCardProps) {
  const t = useTranslations("card");
  const containerRef = useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = useState(280);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setInnerWidth(Math.max(200, element.clientWidth - CARD_HORIZONTAL_PADDING));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const filled = Math.min(card.currentStamps, card.stampTarget);
  const progressPct =
    card.stampTarget > 0
      ? Math.min(100, Math.round((filled / card.stampTarget) * 100))
      : 0;
  const minSpendLabel = formatMinSpend(card.minSpend, card.minSpendCurrency);

  const layout = useMemo(
    () => computeStampGridLayout(card.stampTarget, innerWidth),
    [card.stampTarget, innerWidth],
  );

  return (
    <div
      ref={containerRef}
      className="w-full max-w-sm overflow-hidden rounded-2xl text-white shadow-xl ring-1 ring-white/10"
      style={{
        background: `linear-gradient(145deg, ${card.primaryColor} 0%, color-mix(in srgb, ${card.primaryColor} 62%, #0f172a) 100%)`,
      }}
    >
      <div className="flex flex-col p-4">
        <div className="flex items-center gap-3">
          {card.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.logoUrl}
              alt=""
              className="size-11 shrink-0 rounded-xl border border-white/15 bg-white/10 object-cover shadow-sm"
            />
          ) : (
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold shadow-sm"
              aria-hidden
            >
              {card.businessName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/70">
              {card.businessName}
            </p>
            <h2 className="truncate text-lg font-semibold leading-tight">
              {card.cardName}
            </h2>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-white/80">
            <span>
              {t("progress", {
                current: filled,
                target: card.stampTarget,
              })}
            </span>
            <span>{progressPct}%</span>
          </div>
          <CardProgressBar
            current={filled}
            target={card.stampTarget}
            ariaLabel={t("progressAria", {
              current: filled,
              target: card.stampTarget,
            })}
          />
        </div>

        <div className="flex justify-center py-4">
          <CardStampGrid
            stampTarget={card.stampTarget}
            currentStamps={card.currentStamps}
            primaryColor={card.primaryColor}
            layout={layout}
            stampsAriaLabel={t("stampsAria")}
            stampSlotLabel={(index, isFilled) =>
              t("stampSlot", {
                index,
                state: isFilled ? t("stampFilled") : t("stampEmpty"),
              })
            }
          />
        </div>

        <div className="mt-auto space-y-2">
          {minSpendLabel ? (
            <p className="text-center text-[11px] text-white/70">
              {t("minSpend", { amount: minSpendLabel })}
            </p>
          ) : null}
          <div className="flex items-start gap-2 rounded-xl bg-black/15 px-3 py-2.5 backdrop-blur-sm">
            <Gift className="mt-0.5 size-4 shrink-0 text-white/80" aria-hidden />
            <p className="text-sm font-medium leading-snug">
              {card.rewardDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

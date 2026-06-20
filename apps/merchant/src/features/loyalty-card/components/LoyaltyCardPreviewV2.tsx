"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatEUR, formatNPR } from "@repo/utils/currency";
import { cn } from "@repo/ui/lib/utils";
import type { CurrencyCode, RewardType } from "@repo/supabase/types";
import {
  computeStampGridLayout,
  stampGridBlockHeight,
} from "@/features/loyalty-card/utils/stampGridLayout";

export type LoyaltyCardPreviewV2Props = {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  cardName: string;
  description: string;
  stampTarget: number;
  currentStamps?: number;
  minSpend: number;
  minSpendCurrency: CurrencyCode;
  rewardType: RewardType;
  rewardDescription: string;
  className?: string;
};

type PreviewOrientation = "landscape" | "portrait";

const CARD_WIDTH = {
  landscape: 340,
  portrait: 240,
} as const;

const CARD_PADDING = {
  landscape: { x: 14, y: 14 },
  portrait: { x: 16, y: 16 },
} as const;

const FIXED_CHROME_HEIGHT = {
  landscape: { base: 96, minSpend: 22, reward: 52 },
  portrait: { base: 118, minSpend: 22, reward: 52 },
} as const;

function formatMinSpend(amount: number, currency: CurrencyCode) {
  if (amount <= 0) return null;
  return currency === "EUR" ? formatEUR(amount) : formatNPR(amount);
}

function StampSlot({
  filled,
  primaryColor,
  sizePx,
  onClick,
  stampLabel,
}: {
  filled: boolean;
  primaryColor: string;
  sizePx: number;
  onClick?: () => void;
  stampLabel: string;
}) {
  const iconSize = Math.max(10, Math.round(sizePx * 0.42));
  const Tag = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={stampLabel}
      aria-pressed={onClick ? filled : undefined}
      style={{ width: sizePx, height: sizePx }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        onClick &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        filled
          ? "border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]"
          : "border-white/50 bg-white/5",
        onClick && !filled && "hover:border-white/75 hover:bg-white/10",
      )}
    >
      {filled ? (
        <Check
          style={{ width: iconSize, height: iconSize, color: primaryColor }}
          className="stroke-[2.5]"
          aria-hidden
        />
      ) : (
        <span
          className="rounded-full bg-white/20"
          style={{
            width: Math.max(4, sizePx * 0.16),
            height: Math.max(4, sizePx * 0.16),
          }}
          aria-hidden
        />
      )}
    </Tag>
  );
}

function CardFace({
  businessName,
  logoUrl,
  primaryColor,
  cardName,
  stampTarget,
  filled,
  minSpendLabel,
  rewardDescription,
  orientation,
  onStampClick,
  t,
}: {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  cardName: string;
  stampTarget: number;
  filled: number;
  minSpendLabel: string | null;
  rewardDescription: string;
  orientation: PreviewOrientation;
  onStampClick: (index: number) => void;
  t: ReturnType<typeof useTranslations<"loyaltyCard.preview">>;
}) {
  const isPortrait = orientation === "portrait";
  const cardWidth = CARD_WIDTH[orientation];
  const padding = CARD_PADDING[orientation];
  const innerWidth = cardWidth - padding.x * 2;
  const chrome = FIXED_CHROME_HEIGHT[orientation];

  const layout = useMemo(
    () => computeStampGridLayout(stampTarget, innerWidth, orientation),
    [stampTarget, innerWidth, orientation],
  );

  const stampBlockHeight = stampGridBlockHeight(layout);
  const stampPaddingY = stampTarget <= 10 ? 12 : 8;
  const cardHeight =
    chrome.base +
    stampBlockHeight +
    stampPaddingY * 2 +
    (minSpendLabel ? chrome.minSpend : 0) +
    chrome.reward;

  const progressPct =
    stampTarget > 0 ? Math.min(100, (filled / stampTarget) * 100) : 0;
  const logoSize = isPortrait ? 40 : 36;

  return (
    <div
      className="mx-auto overflow-hidden rounded-2xl text-white shadow-xl ring-1 ring-white/10"
      style={{
        width: cardWidth,
        maxWidth: "100%",
        background: `linear-gradient(145deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 62%, #0f172a) 100%)`,
      }}
    >
      <div
        className="flex flex-col"
        style={{
          minHeight: cardHeight,
          padding: `${padding.y}px ${padding.x}px`,
        }}
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-2.5",
            isPortrait && "flex-col text-center",
          )}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="shrink-0 rounded-xl border border-white/15 bg-white/10 object-cover shadow-sm"
              style={{ width: logoSize, height: logoSize }}
            />
          ) : (
            <div
              className="flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-bold shadow-sm"
              style={{ width: logoSize, height: logoSize }}
            >
              {businessName.charAt(0)}
            </div>
          )}
          <div className={cn("min-w-0", isPortrait ? "w-full" : "flex-1")}>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/70">
              {businessName}
            </p>
            <h3 className="truncate text-sm font-semibold leading-tight sm:text-base">
              {cardName}
            </h3>
          </div>
        </div>

        <div className={cn("mt-3 shrink-0", isPortrait && "text-center")}>
          <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-white/75">
            <span>
              {t("progressShort", { current: filled, target: stampTarget })}
            </span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={filled}
            aria-valuemin={0}
            aria-valuemax={stampTarget}
            aria-label={t("progress", { current: filled, target: stampTarget })}
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div
          className="flex shrink-0 items-center justify-center"
          style={{ padding: `${stampPaddingY}px 0` }}
        >
          <div
            className="grid justify-center"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, ${layout.sizePx}px)`,
              gap: layout.gap,
            }}
            aria-label={t("stampsAria")}
          >
            {Array.from({ length: stampTarget }, (_, i) => (
              <StampSlot
                key={i}
                filled={i < filled}
                primaryColor={primaryColor}
                sizePx={layout.sizePx}
                onClick={() => onStampClick(i)}
                stampLabel={t("stampSlot", {
                  index: i + 1,
                  state: i < filled ? t("stampFilled") : t("stampEmpty"),
                })}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto shrink-0 space-y-1.5">
          {minSpendLabel ? (
            <p
              className={cn(
                "text-[10px] text-white/70",
                isPortrait && "text-center",
              )}
            >
              {t("minSpendShort", { amount: minSpendLabel })}
            </p>
          ) : null}
          <div className="flex items-start gap-2 rounded-xl bg-black/15 px-2.5 py-2 backdrop-blur-sm">
            <Gift
              className="mt-0.5 size-3.5 shrink-0 text-white/80"
              aria-hidden
            />
            <p className="line-clamp-2 text-xs font-medium leading-snug">
              {rewardDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoyaltyCardPreviewV2({
  businessName,
  logoUrl,
  primaryColor,
  cardName,
  stampTarget,
  currentStamps = 0,
  minSpend,
  minSpendCurrency,
  rewardDescription,
  className,
}: LoyaltyCardPreviewV2Props) {
  const t = useTranslations("loyaltyCard.preview");
  const [demoStamps, setDemoStamps] = useState(currentStamps);

  useEffect(() => {
    setDemoStamps(currentStamps);
  }, [currentStamps]);

  useEffect(() => {
    setDemoStamps((count) => Math.min(count, stampTarget));
  }, [stampTarget]);

  const filled = Math.min(demoStamps, stampTarget);
  const minSpendLabel = formatMinSpend(minSpend, minSpendCurrency);

  function handleStampClick(index: number) {
    setDemoStamps((count) => {
      if (index < count - 1) return index + 1;
      if (index === count - 1) return index;
      return index + 1;
    });
  }

  const sharedProps = {
    businessName,
    logoUrl,
    primaryColor,
    cardName,
    stampTarget,
    filled,
    minSpendLabel,
    rewardDescription,
    onStampClick: handleStampClick,
    t,
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <p className="text-xs font-medium merchant-body-muted">
          {t("landscape")}
        </p>
        <CardFace {...sharedProps} orientation="landscape" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium merchant-body-muted">
          {t("portrait")}
        </p>
        <CardFace {...sharedProps} orientation="portrait" />
      </div>

      <p className="text-center text-xs merchant-body-muted">
        {t("tapStampHint")}
      </p>
    </div>
  );
}

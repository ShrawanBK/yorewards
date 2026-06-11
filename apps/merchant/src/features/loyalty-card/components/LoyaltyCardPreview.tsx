"use client";

import { useTranslations } from "next-intl";
import { cn } from "@repo/ui/lib/utils";
import type { CurrencyCode, RewardType } from "@repo/supabase/types";

export type LoyaltyCardPreviewProps = {
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

function formatMinSpend(amount: number, currency: CurrencyCode) {
  if (amount <= 0) return null;
  const symbol = currency === "EUR" ? "€" : "NPR ";
  return currency === "EUR"
    ? `${symbol}${amount}`
    : `${symbol}${amount.toLocaleString()}`;
}

export function LoyaltyCardPreview({
  businessName,
  logoUrl,
  primaryColor,
  cardName,
  description,
  stampTarget,
  currentStamps = 0,
  minSpend,
  minSpendCurrency,
  rewardType,
  rewardDescription,
  className,
}: LoyaltyCardPreviewProps) {
  const t = useTranslations("loyaltyCard.preview");
  const filled = Math.min(currentStamps, stampTarget);
  const minSpendLabel = formatMinSpend(minSpend, minSpendCurrency);

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl p-5 text-white shadow-lg",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 70%, #1e1b4b) 100%)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase opacity-80">
            {businessName}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold">{cardName}</h3>
        </div>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="size-12 shrink-0 rounded-lg border border-white/20 bg-white/10 object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-lg font-bold">
            {businessName.charAt(0)}
          </div>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm opacity-90">{description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5" aria-label={t("stampsAria")}>
        {Array.from({ length: stampTarget }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 border-white/60",
              i < filled ? "bg-white" : "bg-transparent",
            )}
          />
        ))}
      </div>

      <p className="mt-3 text-xs opacity-80">
        {t("progress", { current: filled, target: stampTarget })}
      </p>

      {minSpendLabel ? (
        <p className="mt-1 text-xs opacity-80">
          {t("minSpend", { amount: minSpendLabel })}
        </p>
      ) : null}

      <div className="mt-4 rounded-lg bg-black/20 px-3 py-2 text-sm">
        <p className="text-xs uppercase opacity-70">
          {t(`rewardType.${rewardType}`)}
        </p>
        <p className="font-medium">{rewardDescription}</p>
      </div>
    </div>
  );
}

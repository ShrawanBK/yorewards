"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { Button } from "@repo/ui/button";

type RedemptionCodePanelProps = {
  code: string;
  celebrate?: boolean;
};

export function RedemptionCodePanel({
  code,
  celebrate = false,
}: RedemptionCodePanelProps) {
  const t = useTranslations("reward.code");
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!celebrate || shouldReduceMotion) return;

    let cancelled = false;

    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;

      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#7C3AED", "#EC4899", "#F59E0B"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#7C3AED", "#EC4899", "#F59E0B"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    });

    return () => {
      cancelled = true;
    };
  }, [celebrate, shouldReduceMotion]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-amber/40 bg-brand-amber/10 p-4">
      <div className="space-y-1 text-center">
        <p className="font-medium">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm text-muted-foreground">{t("instructions")}</p>
      </div>
      <p
        className="text-center font-mono text-3xl font-bold tracking-[0.2em] text-foreground"
        aria-label={t("codeAria", { code })}
      >
        {code}
      </p>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        onClick={handleCopy}
        aria-label={t("copyAria")}
      >
        <Copy className="mr-2 size-4" aria-hidden />
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

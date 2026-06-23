"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { StampGridLayout } from "@/features/wallet/utils/stampGridLayout";

type CardStampGridProps = {
  stampTarget: number;
  currentStamps: number;
  primaryColor: string;
  layout: StampGridLayout;
  stampsAriaLabel: string;
  stampSlotLabel: (index: number, filled: boolean) => string;
};

function StampSlot({
  filled,
  primaryColor,
  sizePx,
  stampLabel,
  index,
  animate,
}: {
  filled: boolean;
  primaryColor: string;
  sizePx: number;
  stampLabel: string;
  index: number;
  animate: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const iconSize = Math.max(10, Math.round(sizePx * 0.42));

  const content = filled ? (
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
  );

  return (
    <motion.span
      aria-label={stampLabel}
      style={{ width: sizePx, height: sizePx }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2",
        filled
          ? "border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]"
          : "border-white/50 bg-white/5",
      )}
      initial={
        animate && filled && !shouldReduceMotion ? { scale: 0 } : false
      }
      animate={{ scale: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 400,
              damping: 15,
              delay: filled ? index * 0.03 : 0,
            }
      }
    >
      {content}
    </motion.span>
  );
}

export function CardStampGrid({
  stampTarget,
  currentStamps,
  primaryColor,
  layout,
  stampsAriaLabel,
  stampSlotLabel,
}: CardStampGridProps) {
  const filled = Math.min(currentStamps, stampTarget);

  return (
    <div
      className="grid justify-center"
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, ${layout.sizePx}px)`,
        gap: layout.gap,
      }}
      aria-label={stampsAriaLabel}
    >
      {Array.from({ length: stampTarget }, (_, index) => (
        <StampSlot
          key={index}
          index={index}
          filled={index < filled}
          primaryColor={primaryColor}
          sizePx={layout.sizePx}
          stampLabel={stampSlotLabel(index + 1, index < filled)}
          animate
        />
      ))}
    </div>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("theme");

  useEffect(() => {
    setMounted(true);
  }, []);

  const neutralLabel = t("toggleTheme");

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        className={cn(
          showLabel
            ? "w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            : "size-9",
          className,
        )}
        aria-label={neutralLabel}
        disabled
      >
        <span className="size-4 shrink-0" aria-hidden />
        {showLabel ? <span>{neutralLabel}</span> : null}
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={cn(
        showLabel
          ? "w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          : "size-9",
        className,
      )}
      aria-label={label}
      onClick={() => setTheme(nextTheme)}
    >
      {isDark ? (
        <Sun className="size-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="size-4 shrink-0" aria-hidden />
      )}
      {showLabel ? <span>{label}</span> : null}
    </Button>
  );
}

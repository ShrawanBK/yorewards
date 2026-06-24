"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "yorewards-pwa-hint-dismissed";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

function detectPlatform(): "ios" | "android" | "other" {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaInstallHint() {
  const t = useTranslations("pwa");
  const [hidden, setHidden] = useState(true);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">(
    "other",
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || isDismissed()) return;

    const detected = detectPlatform();
    setPlatform(detected);
    if (detected === "other") return;

    setHidden(false);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // private browsing
    }
    setHidden(true);
  }

  async function handleAndroidInstall() {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === "accepted") dismiss();
    } finally {
      setInstalling(false);
    }
  }

  if (hidden) return null;

  if (platform === "android" && !installPrompt) return null;

  const showAndroid = platform === "android" && installPrompt;

  return (
    <Card className="relative border-brand-purple/20 bg-brand-surface/50">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 text-muted-foreground"
        aria-label={t("dismissAria")}
        onClick={dismiss}
      >
        <X className="size-4" aria-hidden />
      </Button>
      <CardHeader className="pb-2 pr-10">
        <CardTitle className="text-base">
          {showAndroid ? t("android.title") : t("ios.title")}
        </CardTitle>
        <CardDescription>
          {showAndroid ? t("android.subtitle") : t("ios.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAndroid ? (
          <Button
            type="button"
            className="min-h-11 w-full bg-brand-purple hover:bg-brand-purple/90"
            disabled={installing}
            onClick={handleAndroidInstall}
          >
            <Download className="mr-2 size-4" aria-hidden />
            {installing ? t("android.installing") : t("android.install")}
          </Button>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <span className="inline-flex items-start gap-2">
                <Share
                  className="mt-0.5 size-4 shrink-0 text-brand-purple"
                  aria-hidden
                />
                <span>{t("ios.stepShare")}</span>
              </span>
            </li>
            <li>{t("ios.stepAdd")}</li>
            <li>{t("ios.stepConfirm")}</li>
          </ol>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full"
          onClick={dismiss}
        >
          {t("dismiss")}
        </Button>
      </CardContent>
    </Card>
  );
}

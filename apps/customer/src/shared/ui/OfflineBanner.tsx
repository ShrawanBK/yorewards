"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function OfflineBanner() {
  const t = useTranslations("offline");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="border-b border-brand-amber/40 bg-brand-amber/10 px-4 py-2 text-center text-sm text-foreground"
    >
      {t("message")}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

export function StampPendingSpinner() {
  const t = useTranslations("stamp.pending");

  return (
    <div
      className="stamp-pending-spinner"
      role="status"
      aria-label={t("loadingAria")}
    >
      <div className="stamp-pending-spinner__ring" aria-hidden />
      <div className="stamp-pending-spinner__dot" aria-hidden />
    </div>
  );
}

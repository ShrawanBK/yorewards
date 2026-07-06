"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import { buildLoyaltyCardQrUrl } from "@/features/loyalty-card/utils/loyaltyCardQr";

function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function printCanvas(canvas: HTMLCanvasElement, title: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.document.write(
    `<html><head><title>${title}</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${canvas.toDataURL("image/png")}" alt="${title}" /></body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function LoyaltyCardBranchQrDownloads({
  merchantId,
  loyaltyCardId,
  locations,
  appBaseUrl,
}: {
  merchantId: string;
  loyaltyCardId: string;
  locations: MerchantLocationRow[];
  appBaseUrl: string;
}) {
  const t = useTranslations("loyaltyCard.qr");
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm merchant-body-muted">
          {t("noBranches")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm merchant-body-muted">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {locations.map((location) => {
          const qrValue = buildLoyaltyCardQrUrl({
            merchantId,
            loyaltyCardId,
            locationId: location.id,
            appBaseUrl,
          });

          return (
            <div
              key={location.id}
              className="flex flex-col items-center gap-3 rounded-lg border p-4"
            >
              <p className="font-medium">{location.name}</p>
              <QRCodeCanvas
                value={qrValue}
                size={200}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#1E1B4B"
                ref={(node) => {
                  canvasRefs.current[location.id] = node;
                }}
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const canvas = canvasRefs.current[location.id];
                    if (canvas) {
                      downloadCanvasPng(
                        canvas,
                        `yorewards-loyalty-card-qr-${location.name.replace(/\s+/g, "-").toLowerCase()}.png`,
                      );
                    }
                  }}
                >
                  {t("download")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const canvas = canvasRefs.current[location.id];
                    if (canvas) {
                      printCanvas(canvas, location.name);
                    }
                  }}
                >
                  {t("print")}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

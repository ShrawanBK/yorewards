"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";

type QrScannerProps = {
  onScan: (text: string) => void;
  paused?: boolean;
};

type Html5QrcodeInstance = import("html5-qrcode").Html5Qrcode;

async function stopScannerInstance(scanner: Html5QrcodeInstance | null) {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
    await scanner.clear();
  } catch {
    // ignore cleanup errors between retries
  }
}

async function waitForContainer(containerId: string): Promise<HTMLElement> {
  for (let i = 0; i < 10; i += 1) {
    const element = document.getElementById(containerId);
    if (element) return element;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  throw new Error("Scanner container not found");
}

async function requestCameraAccess(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera not supported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
  });
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function QrScanner({ onScan, paused }: QrScannerProps) {
  const t = useTranslations("scan");
  const readerId = useId().replace(/:/g, "");
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const attemptRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const containerId = `${readerId}-${attempt}`;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const startScanner = useCallback(async (targetContainerId: string) => {
    await stopScannerInstance(scannerRef.current);
    scannerRef.current = null;

    await waitForContainer(targetContainerId);

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(targetContainerId);
    scannerRef.current = scanner;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        void stopScannerInstance(scanner).then(() => {
          scannerRef.current = null;
          setIsScanning(false);
          onScanRef.current(decodedText);
        });
      },
      () => {},
    );

    setCameraError(null);
    setIsScanning(true);
  }, []);

  const handleAllowCamera = useCallback(() => {
    if (paused || isRequesting) return;

    void (async () => {
      setIsRequesting(true);
      setCameraError(null);
      scannedRef.current = false;

      try {
        // Called directly from the click handler so the browser can show
        // the permission prompt (including after a previous denial).
        await requestCameraAccess();

        const nextAttempt = attemptRef.current + 1;
        attemptRef.current = nextAttempt;
        setAttempt(nextAttempt);

        await startScanner(`${readerId}-${nextAttempt}`);
      } catch {
        setIsScanning(false);
        setCameraError(t("cameraDenied"));
      } finally {
        setIsRequesting(false);
      }
    })();
  }, [isRequesting, paused, readerId, startScanner, t]);

  useEffect(() => {
    return () => {
      void stopScannerInstance(scannerRef.current).then(() => {
        scannerRef.current = null;
      });
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-black">
      {isScanning ? (
        <div className="scan-pulse-ring pointer-events-none absolute inset-0 z-10" />
      ) : null}
      <div
        key={attempt}
        id={containerId}
        className="aspect-square w-full [&_video]:object-cover"
      />
      {!isScanning ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
          {cameraError ? (
            <p className="text-sm text-destructive" role="alert">
              {cameraError}
            </p>
          ) : (
            <p className="text-sm text-white/80">{t("cameraPrompt")}</p>
          )}
          <Button
            type="button"
            className="min-h-11 bg-brand-purple hover:bg-brand-purple/90"
            disabled={isRequesting || paused}
            onClick={handleAllowCamera}
          >
            {isRequesting ? t("requestingCamera") : t("retryCamera")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

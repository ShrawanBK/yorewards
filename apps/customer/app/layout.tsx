import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@repo/ui/sonner";
import { CustomerProviders } from "@/shared/providers/CustomerProviders";
import {
  PWA_APP_NAME,
  PWA_DESCRIPTION,
  PWA_THEME_COLOR,
} from "@/shared/pwa/config";
import { DEV_SW_CLEANUP_SCRIPT } from "@/shared/pwa/dev-sw-cleanup-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: PWA_APP_NAME,
  title: {
    default: PWA_APP_NAME,
    template: `%s · ${PWA_APP_NAME}`,
  },
  description: PWA_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {process.env.NODE_ENV === "development" ? (
          <Script
            id="yorewards-dev-sw-cleanup"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: DEV_SW_CLEANUP_SCRIPT }}
          />
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <CustomerProviders>
            {children}
            <Toaster />
          </CustomerProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

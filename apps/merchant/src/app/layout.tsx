import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@repo/ui/sonner";
import { MerchantProviders } from "@/shared/providers/MerchantProviders";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YORewards Merchant",
  description: "Merchant dashboard for YORewards loyalty programs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={plusJakarta.variable}
      suppressHydrationWarning
    >
      <body className="min-h-svh bg-background leading-relaxed text-foreground antialiased">
        <MerchantProviders>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster richColors position="top-right" />
          </NextIntlClientProvider>
        </MerchantProviders>
      </body>
    </html>
  );
}

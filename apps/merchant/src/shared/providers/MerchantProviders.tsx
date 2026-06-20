"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryProvider } from "@/shared/providers/QueryProvider";

export function MerchantProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </QueryProvider>
  );
}

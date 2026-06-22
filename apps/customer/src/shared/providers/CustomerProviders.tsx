"use client";

import { AuthProvider } from "@/features/auth";
import { QueryProvider } from "@/shared/providers/QueryProvider";

export function CustomerProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}

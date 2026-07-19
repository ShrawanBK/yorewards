"use client";

import { QueryProvider } from "@/shared/providers/QueryProvider";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

"use client";

import { useSearchParams } from "next/navigation";
import { MerchantAuthForm } from "@/features/auth/components/MerchantAuthForm";

export function MerchantAuthScreen() {
  const params = useSearchParams();
  const tab = params.get("tab") === "signup" ? "signup" : "signin";
  return <MerchantAuthForm defaultTab={tab} />;
}

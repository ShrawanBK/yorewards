"use client";

import { useSearchParams } from "next/navigation";
import { MerchantAuthForm } from "./merchant-auth-form";

export function MerchantAuthScreen() {
  const params = useSearchParams();
  const tab = params.get("tab") === "signup" ? "signup" : "signin";
  return <MerchantAuthForm defaultTab={tab} />;
}

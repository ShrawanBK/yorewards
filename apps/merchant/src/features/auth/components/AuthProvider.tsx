"use client";

import { useEffect } from "react";
import { createClient } from "@repo/supabase/client";
import type { Database } from "@repo/supabase/types";
import { useAuthStore } from "@/features/auth/store/authStore";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      useAuthStore.getState().setUserId(data.user?.id ?? null);
      if (data.user) {
        const res = await fetch("/api/merchant/me");
        if (res.ok) {
          const json = (await res.json()) as { merchant: Merchant | null };
          useAuthStore.getState().setMerchant(json.merchant);
        }
      }
      useAuthStore.getState().setLoading(false);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);
  return children;
}

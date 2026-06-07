"use client";

import { create } from "zustand";
import { createClient } from "@repo/supabase/client";
import { useEffect } from "react";
import type { Database } from "@repo/supabase/types";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

type AuthStore = {
  userId: string | null;
  merchant: Merchant | null;
  isLoading: boolean;
  setUserId: (id: string | null) => void;
  setMerchant: (m: Merchant | null) => void;
  setLoading: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  merchant: null,
  isLoading: true,
  setUserId: (userId) => set({ userId }),
  setMerchant: (merchant) => set({ merchant }),
  setLoading: (isLoading) => set({ isLoading }),
}));

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

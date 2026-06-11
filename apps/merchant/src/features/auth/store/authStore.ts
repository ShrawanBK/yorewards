"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Database } from "@repo/supabase/types";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

interface AuthState {
  userId: string | null;
  merchant: Merchant | null;
  isLoading: boolean;
  setUserId: (id: string | null) => void;
  setMerchant: (m: Merchant | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      userId: null,
      merchant: null,
      isLoading: true,
      setUserId: (userId) => set({ userId }),
      setMerchant: (merchant) => set({ merchant }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: "auth-store" },
  ),
);

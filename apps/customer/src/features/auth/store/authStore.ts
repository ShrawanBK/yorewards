"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { getCustomerSessionAction } from "@/features/auth/api/authActions";
import type { CustomerProfile } from "@/features/auth/types/auth.types";
import { isActionFailure } from "@/shared/types/action-result";

type AuthStore = {
  customerId: string | null;
  name: string | null;
  phone: string | null;
  isLoading: boolean;
  setProfile: (p: CustomerProfile | null) => void;
  setLoading: (v: boolean) => void;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  customerId: null,
  name: null,
  phone: null,
  isLoading: true,
  setProfile: (p) =>
    set({
      customerId: p?.id ?? null,
      name: p?.name ?? null,
      phone: p?.phone ?? null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  refreshProfile: async () => {
    const result = await getCustomerSessionAction();
    if (isActionFailure(result)) {
      set({ customerId: null, name: null, phone: null, isLoading: false });
      return;
    }
    const customer = result.customer;
    set({
      customerId: customer?.id ?? null,
      name: customer?.name ?? null,
      phone: customer?.phone ?? null,
      isLoading: false,
    });
  },
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useAuthStore.getState().refreshProfile();
  }, []);

  return children;
}

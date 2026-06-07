"use client";

import { create } from "zustand";
import { createClient } from "@repo/supabase/client";
import { useEffect } from "react";

type AuthStore = {
  userId: string | null;
  isLoading: boolean;
  setUserId: (id: string | null) => void;
  setLoading: (v: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  isLoading: true,
  setUserId: (userId) => set({ userId }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      useAuthStore.getState().setUserId(data.user?.id ?? null);
      useAuthStore.getState().setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      useAuthStore.getState().setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return children;
}

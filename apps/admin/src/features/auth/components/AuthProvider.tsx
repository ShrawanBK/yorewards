"use client";

import { useEffect } from "react";
import { createClient } from "@repo/supabase/client";
import { useAuthStore } from "@/features/auth/store/authStore";

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

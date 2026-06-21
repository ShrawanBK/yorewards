"use client";

import { create } from "zustand";

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

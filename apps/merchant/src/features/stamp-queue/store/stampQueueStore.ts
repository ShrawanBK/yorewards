"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";

interface StampQueueState {
  items: PendingStampQueueItem[];
  isHydrated: boolean;
  setItems: (items: PendingStampQueueItem[]) => void;
  addItem: (item: PendingStampQueueItem) => void;
  removeItem: (sessionId: string) => void;
  setHydrated: (value: boolean) => void;
}

export const useStampQueueStore = create<StampQueueState>()(
  devtools(
    (set) => ({
      items: [],
      isHydrated: false,
      setItems: (items) => set({ items }),
      addItem: (item) =>
        set((state) => {
          if (state.items.some((existing) => existing.id === item.id)) {
            return state;
          }
          return { items: [...state.items, item].sort(sortByCreatedAt) };
        }),
      removeItem: (sessionId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== sessionId),
        })),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    { name: "stamp-queue-store" },
  ),
);

function sortByCreatedAt(a: PendingStampQueueItem, b: PendingStampQueueItem) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function selectQueueCount(state: StampQueueState) {
  return state.items.length;
}

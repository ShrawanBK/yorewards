"use client";

import { useEffect, useRef } from "react";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";
import {
  subscribeStampQueue,
  unsubscribeStampQueue,
} from "@/features/stamp-queue/lib/subscribeStampQueue";
import { useStampQueueStore } from "@/features/stamp-queue/store/stampQueueStore";

export function useStampQueue(
  merchantId: string,
  initialItems: PendingStampQueueItem[],
) {
  const setItems = useStampQueueStore((s) => s.setItems);
  const addItem = useStampQueueStore((s) => s.addItem);
  const removeItem = useStampQueueStore((s) => s.removeItem);
  const setHydrated = useStampQueueStore((s) => s.setHydrated);
  const items = useStampQueueStore((s) => s.items);
  const isHydrated = useStampQueueStore((s) => s.isHydrated);
  const merchantRef = useRef(merchantId);

  useEffect(() => {
    merchantRef.current = merchantId;
    setItems(initialItems);
    setHydrated(true);
  }, [merchantId, initialItems, setItems, setHydrated]);

  useEffect(() => {
    const channel = subscribeStampQueue(merchantId, {
      onInsert: addItem,
      onRemove: removeItem,
      onRefresh: () => {},
    });

    return () => unsubscribeStampQueue(channel);
  }, [merchantId, addItem, removeItem]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      for (const item of useStampQueueStore.getState().items) {
        if (now - new Date(item.createdAt).getTime() >= 5 * 60 * 1000) {
          removeItem(item.id);
        }
      }
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [removeItem]);

  return { items, isHydrated };
}

export function useStampQueueTabBadge(count: number) {
  useEffect(() => {
    const baseTitle = "YORewards Merchant";
    document.title = count > 0 ? `[${count}] ${baseTitle}` : baseTitle;
    return () => {
      document.title = baseTitle;
    };
  }, [count]);
}

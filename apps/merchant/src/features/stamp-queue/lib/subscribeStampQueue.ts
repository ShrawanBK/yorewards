import { createClient } from "@repo/supabase/client";
import type { PendingStampQueueItem } from "@repo/supabase/queries/stamps";

const PENDING_TTL_MS = 5 * 60 * 1000;

type RawStampPayload = {
  id: string;
  merchant_id: string;
  customer_card_id: string;
  location_id: string | null;
  created_at: string;
  status: string;
};

type EnrichedStampRow = {
  id: string;
  merchant_id: string;
  customer_card_id: string;
  location_id: string | null;
  created_at: string;
  status: string;
  customer_cards: {
    current_stamps: number;
    customers: { name: string | null } | null;
    loyalty_cards: { card_name: string; stamp_target: number; min_spend: number; min_spend_currency: string } | null;
  } | null;
  merchant_locations: { name: string } | null;
};

export type StampQueueHandlers = {
  onInsert: (item: PendingStampQueueItem) => void;
  onRemove: (sessionId: string) => void;
  onRefresh: () => void;
};

type StampQueueChannel = ReturnType<ReturnType<typeof createClient>["channel"]>;

async function enrichPendingSession(
  row: RawStampPayload,
): Promise<PendingStampQueueItem | null> {
  if (row.status !== "pending") return null;
  if (Date.now() - new Date(row.created_at).getTime() >= PENDING_TTL_MS) {
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select(
      `
      id,
      merchant_id,
      customer_card_id,
      location_id,
      created_at,
      status,
      customer_cards (
        current_stamps,
        customers ( name ),
        loyalty_cards ( card_name, stamp_target, min_spend, min_spend_currency )
      ),
      merchant_locations ( name )
    `,
    )
    .eq("id", row.id)
    .maybeSingle();

  if (error || !data) return null;

  const enriched = data as EnrichedStampRow;
  const card = enriched.customer_cards;

  return {
    id: enriched.id,
    merchantId: enriched.merchant_id,
    customerCardId: enriched.customer_card_id,
    locationId: enriched.location_id,
    createdAt: enriched.created_at,
    customerName: card?.customers?.name ?? null,
    cardName: card?.loyalty_cards?.card_name ?? "Loyalty card",
    branchName: enriched.merchant_locations?.name ?? null,
    currentStamps: card?.current_stamps ?? 0,
    stampTarget: card?.loyalty_cards?.stamp_target ?? 0,
    minSpend: card?.loyalty_cards?.min_spend ?? 0,
    minSpendCurrency: card?.loyalty_cards?.min_spend_currency ?? "NPR",
  };
}

export function subscribeStampQueue(
  merchantId: string,
  handlers: StampQueueHandlers,
): StampQueueChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`stamp-queue-${merchantId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "stamp_sessions",
        filter: `merchant_id=eq.${merchantId}`,
      },
      async (payload) => {
        const row = payload.new as RawStampPayload;
        const item = await enrichPendingSession(row);
        if (item) handlers.onInsert(item);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "stamp_sessions",
        filter: `merchant_id=eq.${merchantId}`,
      },
      (payload) => {
        const row = payload.new as RawStampPayload;
        if (row.status !== "pending") {
          handlers.onRemove(row.id);
        }
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribeStampQueue(channel: StampQueueChannel) {
  const supabase = createClient();
  void supabase.removeChannel(channel);
}

import { createClient } from "../client";
import { createServiceRoleClient } from "../service-role";

export const DISPUTE_BROADCAST_CHANNEL = "platform-disputes";
export const DISPUTE_BROADCAST_EVENT = "dispute_changed";

export type DisputeBroadcastPayload = {
  disputeId: string;
  merchantId: string;
  customerCardId: string;
  status: string;
};

export type DisputeBroadcastFilter = {
  merchantId?: string;
  customerCardId?: string;
};

type DisputeBroadcastChannel = ReturnType<ReturnType<typeof createClient>["channel"]>;

function waitForChannelSubscribe(
  channel: ReturnType<ReturnType<typeof createServiceRoleClient>["channel"]>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DISPUTE_BROADCAST_TIMEOUT")), 5000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(new Error(`DISPUTE_BROADCAST_${status}`));
      }
    });
  });
}

/** Server-side push when a dispute is created or resolved (does not depend on RLS Realtime). */
export async function notifyDisputeChange(
  payload: DisputeBroadcastPayload,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const channel = supabase.channel(DISPUTE_BROADCAST_CHANNEL);

  try {
    await waitForChannelSubscribe(channel);
    await channel.send({
      type: "broadcast",
      event: DISPUTE_BROADCAST_EVENT,
      payload,
    });
  } catch (err) {
    console.error("[notifyDisputeChange]", err);
  } finally {
    await supabase.removeChannel(channel);
  }
}

export function subscribeDisputeBroadcast(
  handlers: { onChange: (payload: DisputeBroadcastPayload) => void },
  filter?: DisputeBroadcastFilter,
): DisputeBroadcastChannel {
  const supabase = createClient();
  const suffix = filter?.customerCardId
    ? `card-${filter.customerCardId}`
    : filter?.merchantId
      ? `merchant-${filter.merchantId}`
      : "admin";

  const channel = supabase
    .channel(`dispute-broadcast-${suffix}`)
    .on("broadcast", { event: DISPUTE_BROADCAST_EVENT }, (message) => {
      const payload = message.payload as DisputeBroadcastPayload;
      if (filter?.merchantId && payload.merchantId !== filter.merchantId) return;
      if (filter?.customerCardId && payload.customerCardId !== filter.customerCardId) {
        return;
      }
      handlers.onChange(payload);
    })
    .subscribe();

  return channel;
}

export function unsubscribeDisputeBroadcast(channel: DisputeBroadcastChannel) {
  const supabase = createClient();
  void supabase.removeChannel(channel);
}

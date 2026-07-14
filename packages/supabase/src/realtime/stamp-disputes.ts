import type { DisputeBroadcastFilter } from "./dispute-broadcast";
import {
  DISPUTE_BROADCAST_EVENT,
  subscribeDisputeBroadcast,
  unsubscribeDisputeBroadcast,
  type DisputeBroadcastPayload,
} from "./dispute-broadcast";

export type StampDisputeChangeEvent = "INSERT" | "UPDATE";

export type StampDisputesRealtimeScope =
  | { kind: "merchant"; merchantId: string }
  | { kind: "admin" }
  | { kind: "card"; customerCardId: string };

export type StampDisputesRealtimeHandlers = {
  onChange: (event: StampDisputeChangeEvent) => void;
};

type StampDisputesChannel = ReturnType<
  ReturnType<typeof import("../client").createClient>["channel"]
>;

function scopeToFilter(scope: StampDisputesRealtimeScope): DisputeBroadcastFilter | undefined {
  if (scope.kind === "merchant") return { merchantId: scope.merchantId };
  if (scope.kind === "card") return { customerCardId: scope.customerCardId };
  return undefined;
}

function payloadToEvent(payload: DisputeBroadcastPayload): StampDisputeChangeEvent {
  return payload.status === "pending" ? "INSERT" : "UPDATE";
}

/** Live dispute updates via server broadcast (reliable for admin without JWT RLS on postgres_changes). */
export function subscribeStampDisputes(
  scope: StampDisputesRealtimeScope,
  handlers: StampDisputesRealtimeHandlers,
): StampDisputesChannel {
  return subscribeDisputeBroadcast(
    {
      onChange: (payload) => handlers.onChange(payloadToEvent(payload)),
    },
    scopeToFilter(scope),
  );
}

export function unsubscribeStampDisputes(channel: StampDisputesChannel) {
  unsubscribeDisputeBroadcast(channel);
}

export { DISPUTE_BROADCAST_EVENT };

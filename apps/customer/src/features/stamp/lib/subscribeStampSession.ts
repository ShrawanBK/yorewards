import { createClient } from "@repo/supabase/client";
import type { StampSessionStatus } from "@repo/supabase/types";

const LOG_PREFIX = "[stamp-pending]";

export function subscribeStampSession(
  sessionId: string,
  onStatusChange: (
    status: StampSessionStatus,
    rejectionReason?: string | null,
  ) => void,
): () => void {
  const supabase = createClient();
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  void supabase.auth.getSession().then(({ data }) => {
    if (cancelled) return;

    if (!data.session) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`${LOG_PREFIX} websocket skipped: no auth session`);
      }
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`${LOG_PREFIX} websocket connecting for session`, sessionId);
    }

    channel = supabase
      .channel(`customer-stamp-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stamp_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: StampSessionStatus;
            rejection_reason?: string | null;
          };
          onStatusChange(row.status, row.rejection_reason);
        },
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`${LOG_PREFIX} websocket channel:`, status);
        }
      });
  });

  return () => {
    cancelled = true;
    if (channel) {
      void supabase.removeChannel(channel);
    }
  };
}

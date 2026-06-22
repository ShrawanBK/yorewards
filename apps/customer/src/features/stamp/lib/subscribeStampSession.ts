import { createClient } from "@repo/supabase/client";
import type { StampSessionStatus } from "@repo/supabase/types";

export function subscribeStampSession(
  sessionId: string,
  onStatusChange: (
    status: StampSessionStatus,
    rejectionReason?: string | null,
  ) => void,
) {
  const supabase = createClient();
  const channel = supabase
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
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

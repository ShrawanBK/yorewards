import type { ActionFailure, ActionResult } from "@/shared/types/action-result";
import type { StampSessionStatus } from "@repo/supabase/types";

type StampSessionStatusPayload = {
  status: StampSessionStatus;
  rejectionReason: string | null;
  customerCardId: string;
};

export async function fetchStampSessionStatus(
  sessionId: string,
): Promise<ActionResult<StampSessionStatusPayload>> {
  const response = await fetch(`/api/stamp-sessions/${sessionId}/status`, {
    cache: "no-store",
    credentials: "same-origin",
  });

  const body = (await response.json()) as
    | StampSessionStatusPayload
    | ActionFailure;

  if (!response.ok) {
    if ("error" in body && body.error) return body;
    return { error: { code: "UNKNOWN" } };
  }

  return body as StampSessionStatusPayload;
}

"use server";

import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  lookupAdminStampCards,
  refreshAdminStampCardLookup,
  type AdminStampCardLookup,
} from "@repo/supabase/queries/admin-stamps";
import { revalidatePath } from "next/cache";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export type StampActionResult = ActionResult<{ card?: AdminStampCardLookup }>;

export async function lookupStampCardsAction(
  query: string,
): Promise<{ cards: AdminStampCardLookup[] } | { error: StampActionResult["error"] }> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { error: guard.result.error };

  const trimmed = query.trim();
  if (!trimmed) {
    return { error: fail("STAMP_SEARCH_REQUIRED").error };
  }

  try {
    const cards = await lookupAdminStampCards(trimmed);
    return { cards };
  } catch (err) {
    logActionFailure("lookupStampCards", err);
    return { error: fail("UNKNOWN").error };
  }
}

export async function issueStampManualAction(
  cardId: string,
  notes?: string,
): Promise<StampActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const card = await refreshAdminStampCardLookup(cardId);
  if (!card) return fail("CUSTOMER_CARD_NOT_FOUND");

  const { data: sessionId, error: rpcError } = await admin.rpc(
    "issue_stamp_manual",
    { p_card_id: cardId },
  );

  if (rpcError || !sessionId) {
    logActionFailure("issueStampManual", rpcError);
    return fail("STAMP_ISSUE_FAILED");
  }

  const trimmedNotes = notes?.trim();
  await admin.from("audit_log").insert({
    action: "issue_stamp_manual",
    admin_id: guard.user.id,
    target_type: "stamp",
    target_id: sessionId,
    notes:
      trimmedNotes ||
      `${card.customerName ?? card.phone} · ${card.merchantName} · ${card.cardName}`,
  });

  revalidatePath("/admin/stamps");
  revalidatePath("/admin/dashboard");

  const updatedCard = await refreshAdminStampCardLookup(cardId);
  return updatedCard ? { card: updatedCard } : {};
}

export async function voidStampAction(
  sessionId: string,
  notes?: string,
): Promise<StampActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { data: session, error: fetchError } = await admin
    .from("stamp_sessions")
    .select("id, customer_card_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) {
    logActionFailure("voidStamp.fetch", fetchError);
    return fail("STAMP_VOID_FAILED");
  }
  if (!session) return fail("STAMP_SESSION_NOT_FOUND");
  if (session.status !== "approved") return fail("STAMP_VOID_FAILED");

  const card = await refreshAdminStampCardLookup(session.customer_card_id);

  const { error: rpcError } = await admin.rpc("void_stamp", {
    p_session_id: sessionId,
  });

  if (rpcError) {
    logActionFailure("voidStamp", rpcError);
    return fail("STAMP_VOID_FAILED");
  }

  const trimmedNotes = notes?.trim();
  await admin.from("audit_log").insert({
    action: "void_stamp",
    admin_id: guard.user.id,
    target_type: "stamp",
    target_id: sessionId,
    notes: trimmedNotes || (card ? `${card.customerName ?? card.phone} · void` : null),
  });

  revalidatePath("/admin/stamps");
  revalidatePath("/admin/dashboard");

  const updatedCard = await refreshAdminStampCardLookup(session.customer_card_id);
  return updatedCard ? { card: updatedCard } : {};
}

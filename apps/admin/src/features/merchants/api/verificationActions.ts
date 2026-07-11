"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import {
  approveVerificationDocument,
  rejectVerificationDocument,
} from "@repo/supabase/queries/merchant-verification";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@repo/utils/action-error";

export async function approveVerificationDocumentAction(
  documentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  try {
    await approveVerificationDocument(documentId, user.id);
    revalidatePath("/admin/merchants");
    return {};
  } catch (err) {
    logActionFailure("approveVerificationDocument", err);
    return fail("UNKNOWN");
  }
}

export async function rejectVerificationDocumentAction(
  documentId: string,
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  if (!reason.trim()) return fail("REJECTION_REASON_REQUIRED");

  try {
    await rejectVerificationDocument(documentId, user.id, reason.trim());
    revalidatePath("/admin/merchants");
    return {};
  } catch (err) {
    logActionFailure("rejectVerificationDocument", err);
    return fail("UNKNOWN");
  }
}

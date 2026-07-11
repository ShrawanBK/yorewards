import { listPendingVerificationDocuments } from "@repo/supabase/queries/merchant-verification";

export async function getPendingVerificationDocumentsAction() {
  return listPendingVerificationDocuments();
}

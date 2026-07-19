import { createServiceRoleClient } from "../service-role";

export type VerificationDocumentType =
  | "registration"
  | "pan"
  | "business_license"
  | "other";

export type VerificationDocumentStatus = "pending" | "approved" | "rejected";

export type MerchantVerificationDocumentRow = {
  id: string;
  merchant_id: string;
  document_type: VerificationDocumentType;
  file_url: string;
  status: VerificationDocumentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export async function listMerchantVerificationDocuments(
  merchantId: string,
): Promise<MerchantVerificationDocumentRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_verification_documents")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MerchantVerificationDocumentRow[];
}

export async function submitVerificationDocument(input: {
  merchantId: string;
  documentType: VerificationDocumentType;
  fileUrl: string;
}): Promise<MerchantVerificationDocumentRow> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("merchant_verification_documents")
    .insert({
      merchant_id: input.merchantId,
      document_type: input.documentType,
      file_url: input.fileUrl,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("merchants")
    .update({ verification_status: "pending" })
    .eq("id", input.merchantId)
    .eq("verification_status", "unverified");

  return data as MerchantVerificationDocumentRow;
}

export async function listPendingVerificationDocuments(): Promise<
  (MerchantVerificationDocumentRow & {
    business_name: string;
    merchant_email: string;
  })[]
> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_verification_documents")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const merchantIds = [...new Set(data.map((row) => row.merchant_id))];
  const { data: merchants, error: merchantsError } = await supabase
    .from("merchants")
    .select("id, business_name, email")
    .in("id", merchantIds);

  if (merchantsError) throw merchantsError;

  const merchantById = new Map(
    (merchants ?? []).map((merchant) => [merchant.id, merchant]),
  );

  return data.map((row) => {
    const merchant = merchantById.get(row.merchant_id);
    return {
      ...(row as MerchantVerificationDocumentRow),
      business_name: merchant?.business_name ?? "—",
      merchant_email: merchant?.email ?? "—",
    };
  });
}

export async function approveVerificationDocument(
  documentId: string,
  reviewedBy: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: doc, error: docError } = await supabase
    .from("merchant_verification_documents")
    .select("merchant_id")
    .eq("id", documentId)
    .maybeSingle();

  if (docError) throw docError;
  if (!doc) throw new Error("document_not_found");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("merchant_verification_documents")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: now,
    })
    .eq("id", documentId);

  if (error) throw error;

  await supabase
    .from("merchants")
    .update({
      verification_status: "verified",
      verified_at: now,
    })
    .eq("id", doc.merchant_id);
}

export async function rejectVerificationDocument(
  documentId: string,
  reviewedBy: string,
  reason: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: doc, error: docError } = await supabase
    .from("merchant_verification_documents")
    .select("merchant_id")
    .eq("id", documentId)
    .maybeSingle();

  if (docError) throw docError;
  if (!doc) throw new Error("document_not_found");

  const { error } = await supabase
    .from("merchant_verification_documents")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", documentId);

  if (error) throw error;

  await supabase
    .from("merchants")
    .update({ verification_status: "rejected" })
    .eq("id", doc.merchant_id);
}

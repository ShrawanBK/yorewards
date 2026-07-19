"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { submitVerificationDocument } from "@repo/supabase/queries/merchant-verification";
import { merchantCanUseVerifiedBadge } from "@repo/utils/plan-limits";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

const DOC_BUCKET = "merchant-logos";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function uploadVerificationDocumentAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  const { data: merchant, error: merchantError } = await createServiceRoleClient()
    .from("merchants")
    .select("subscription_tier")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (!merchant || !merchantCanUseVerifiedBadge(merchant.subscription_tier)) {
    return fail("PLAN_FEATURE_REQUIRED");
  }

  const file = formData.get("file");
  const documentType = String(formData.get("document_type") ?? "registration");
  if (!(file instanceof File) || file.size === 0) {
    return fail("VERIFICATION_DOC_REQUIRED");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return fail("LOGO_FILE_TOO_LARGE");
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return fail("LOGO_FILE_TYPE_INVALID");
  }

  const admin = createServiceRoleClient();
  const path = `verification/${merchantId}/${Date.now()}-${file.name}`;

  try {
    const { error: uploadError } = await admin.storage
      .from(DOC_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = admin.storage.from(DOC_BUCKET).getPublicUrl(path);

    await submitVerificationDocument({
      merchantId,
      documentType: documentType as "registration" | "pan" | "business_license" | "other",
      fileUrl: publicUrl.publicUrl,
    });

    revalidatePath("/merchant/settings");
    return {};
  } catch (err) {
    logActionFailure("uploadVerificationDocument", err);
    return fail("VERIFICATION_UPLOAD_FAILED");
  }
}

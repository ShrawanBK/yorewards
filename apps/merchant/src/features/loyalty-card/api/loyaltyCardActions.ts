"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  getLoyaltyCardByMerchantId,
  updateMerchantBranding,
  upsertLoyaltyCardForMerchant,
} from "@repo/supabase/queries/loyalty-cards";
import type { CurrencyCode, RewardType } from "@repo/supabase/types";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionFailure, ActionResult } from "@/shared/types/action-result";

const LOGO_BUCKET = "merchant-logos";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const LOYALTY_CARD_ROUTE = "/merchant/loyalty-card";

function revalidateLoyaltyCardPaths() {
  revalidatePath(LOYALTY_CARD_ROUTE);
  revalidatePath("/merchant/business");
}

async function assertOwnsMerchant(
  userId: string,
  merchantId: string,
): Promise<
  | { error: ActionFailure["error"]; merchant: null }
  | { error: null; merchant: NonNullable<Awaited<ReturnType<typeof getMerchantsByUserId>>[number]> }
> {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return { error: fail("BUSINESS_NOT_FOUND").error, merchant: null };
  return { error: null, merchant };
}

export async function saveLoyaltyCardConfigAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const { error: denied, merchant } = await assertOwnsMerchant(
    user.id,
    merchantId,
  );
  if (denied || !merchant) return fail("BUSINESS_NOT_FOUND");

  if (merchant.status !== "active") {
    return fail("BUSINESS_NOT_ACTIVE");
  }

  const cardName = String(formData.get("card_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  const stampTarget = Number(formData.get("stamp_target"));
  const minSpendRaw = String(formData.get("min_spend") ?? "").trim();
  const minSpend = minSpendRaw === "" ? 0 : Number(minSpendRaw);
  const minSpendCurrency = String(
    formData.get("min_spend_currency") ?? "",
  ).trim() as CurrencyCode;
  const rewardType = String(formData.get("reward_type") ?? "") as RewardType;
  const rewardValue = String(formData.get("reward_value") ?? "").trim();
  const rewardDescription = String(
    formData.get("reward_description") ?? "",
  ).trim();

  if (!cardName || cardName.length > 40) {
    return fail("LOYALTY_CARD_NAME_INVALID");
  }
  if (!description || description.length > 120) {
    return fail("LOYALTY_CARD_DESCRIPTION_INVALID");
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    return fail("LOYALTY_CARD_COLOR_INVALID");
  }
  if (!Number.isInteger(stampTarget) || stampTarget < 5 || stampTarget > 50) {
    return fail("LOYALTY_CARD_STAMP_TARGET_INVALID");
  }
  if (Number.isNaN(minSpend) || minSpend < 0) {
    return fail("LOYALTY_CARD_MIN_SPEND_INVALID");
  }
  if (!["NPR", "EUR"].includes(minSpendCurrency)) {
    return fail("LOYALTY_CARD_CURRENCY_INVALID");
  }
  if (
    !["free_item", "percent_discount", "fixed_discount"].includes(rewardType)
  ) {
    return fail("LOYALTY_CARD_REWARD_TYPE_INVALID");
  }
  if (!rewardValue) return fail("LOYALTY_CARD_REWARD_VALUE_REQUIRED");
  if (!rewardDescription) return fail("LOYALTY_CARD_REWARD_DESCRIPTION_REQUIRED");

  try {
    await updateMerchantBranding(merchantId, {
      primary_color: primaryColor,
    });

    await upsertLoyaltyCardForMerchant(merchantId, {
      card_name: cardName,
      description,
      stamp_target: stampTarget,
      min_spend: minSpend,
      min_spend_currency: minSpendCurrency,
      reward_type: rewardType,
      reward_value: rewardValue,
      reward_description: rewardDescription,
      is_active: true,
    });

    revalidateLoyaltyCardPaths();
    return {};
  } catch (e) {
    logActionFailure("saveLoyaltyCardConfig", e);
    return fail("LOYALTY_CARD_SAVE_FAILED");
  }
}

export async function uploadLoyaltyCardLogoAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult & { logoUrl?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const { error: denied, merchant } = await assertOwnsMerchant(
    user.id,
    merchantId,
  );
  if (denied || !merchant) return fail("BUSINESS_NOT_FOUND");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return fail("LOGO_FILE_REQUIRED");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return fail("LOGO_FILE_TOO_LARGE");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return fail("LOGO_FILE_TYPE_INVALID");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${merchantId}/logo.${ext}`;

  const admin = createServiceRoleClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    logActionFailure("uploadLoyaltyCardLogo", uploadError);
    return fail("LOGO_UPLOAD_FAILED");
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);

  await updateMerchantBranding(merchantId, { logo_url: publicUrl });
  revalidateLoyaltyCardPaths();

  return { logoUrl: publicUrl };
}

export async function getLoyaltyCardConfigForMerchant(merchantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { error, merchant } = await assertOwnsMerchant(user.id, merchantId);
  if (error || !merchant) return null;

  const loyaltyCard = await getLoyaltyCardByMerchantId(merchantId);
  return { merchant, loyaltyCard };
}

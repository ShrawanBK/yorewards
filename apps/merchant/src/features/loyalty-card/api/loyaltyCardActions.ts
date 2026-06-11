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
import type { CountryCode, CurrencyCode, RewardType } from "@repo/supabase/types";
import type { ActionResult } from "@/shared/types/action-result";

const LOGO_BUCKET = "merchant-logos";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const LOYALTY_CARD_ROUTE = "/merchant/loyalty-card";

function currencyForCountry(country: CountryCode): CurrencyCode {
  return country === "FI" ? "EUR" : "NPR";
}

function revalidateLoyaltyCardPaths() {
  revalidatePath(LOYALTY_CARD_ROUTE);
  revalidatePath("/merchant/business");
}

async function assertOwnsMerchant(userId: string, merchantId: string) {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return { error: "Business not found" as const, merchant: null };
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
  if (!user) return { error: "Unauthorized" };

  const { error: denied, merchant } = await assertOwnsMerchant(
    user.id,
    merchantId,
  );
  if (denied || !merchant) return { error: denied ?? "Business not found" };

  if (merchant.status !== "active") {
    return {
      error: "Your business must be approved before saving loyalty card settings.",
    };
  }

  const cardName = String(formData.get("card_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  const stampTarget = Number(formData.get("stamp_target"));
  const minSpendRaw = String(formData.get("min_spend") ?? "").trim();
  const minSpend = minSpendRaw === "" ? 0 : Number(minSpendRaw);
  const rewardType = String(formData.get("reward_type") ?? "") as RewardType;
  const rewardValue = String(formData.get("reward_value") ?? "").trim();
  const rewardDescription = String(formData.get("reward_description") ?? "").trim();

  if (!cardName || cardName.length > 40) {
    return { error: "Card name is required (max 40 characters)." };
  }
  if (!description || description.length > 120) {
    return { error: "Description is required (max 120 characters)." };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    return { error: "Pick a valid brand color." };
  }
  if (!Number.isInteger(stampTarget) || stampTarget < 5 || stampTarget > 50) {
    return { error: "Stamp target must be between 5 and 50." };
  }
  if (Number.isNaN(minSpend) || minSpend < 0) {
    return { error: "Minimum spend must be 0 or greater." };
  }
  if (
    !["free_item", "percent_discount", "fixed_discount"].includes(rewardType)
  ) {
    return { error: "Select a reward type." };
  }
  if (!rewardValue) return { error: "Reward value is required." };
  if (!rewardDescription) return { error: "Reward description is required." };

  try {
    await updateMerchantBranding(merchantId, {
      primary_color: primaryColor,
    });

    await upsertLoyaltyCardForMerchant(merchantId, {
      card_name: cardName,
      description,
      stamp_target: stampTarget,
      min_spend: minSpend,
      min_spend_currency: currencyForCountry(merchant.country),
      reward_type: rewardType,
      reward_value: rewardValue,
      reward_description: rewardDescription,
      is_active: true,
    });

    revalidateLoyaltyCardPaths();
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Failed to save loyalty card settings",
    };
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
  if (!user) return { error: "Unauthorized" };

  const { error: denied, merchant } = await assertOwnsMerchant(
    user.id,
    merchantId,
  );
  if (denied || !merchant) return { error: denied ?? "Business not found" };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image must be 2MB or smaller." };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Use JPG, PNG, or WebP." };
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

  if (uploadError) return { error: uploadError.message };

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

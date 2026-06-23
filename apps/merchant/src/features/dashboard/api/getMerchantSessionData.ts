import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import {
  getMerchantByUserId,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import {
  getActiveLocationsByMerchantId,
  resolveActiveLocationForMerchant,
} from "@repo/supabase/queries/locations";

export type MerchantSessionWithBusiness = {
  user: NonNullable<
    Awaited<
      ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>
    >["data"]["user"]
  >;
  merchants: MerchantRow[];
  merchant: MerchantRow;
  branches: MerchantLocationRow[];
  activeBranch: MerchantLocationRow | null;
};

export type MerchantSessionForShell =
  | MerchantSessionWithBusiness
  | {
      user: MerchantSessionWithBusiness["user"];
      merchants: [];
      merchant: null;
      branches: [];
      activeBranch: null;
    };

async function loadMerchantSession(requireBusiness: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/merchant/login");
  }

  const merchants = await getMerchantsByUserId(user.id);
  if (merchants.length === 0) {
    if (!requireBusiness) {
      return {
        user,
        merchants: [],
        merchant: null,
        branches: [],
        activeBranch: null,
      } satisfies MerchantSessionForShell;
    }
    redirect("/merchant/add-business");
  }

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) {
    if (!requireBusiness) {
      return {
        user,
        merchants: [],
        merchant: null,
        branches: [],
        activeBranch: null,
      } satisfies MerchantSessionForShell;
    }
    redirect("/merchant/add-business");
  }

  const [branches, activeBranch] = await Promise.all([
    getActiveLocationsByMerchantId(merchant.id),
    resolveActiveLocationForMerchant(merchant.id),
  ]);

  return {
    user,
    merchants,
    merchant,
    branches,
    activeBranch,
  } satisfies MerchantSessionWithBusiness;
}

/** Requires an active merchant; redirects to add-business or login when missing. */
export async function getMerchantSessionData(): Promise<MerchantSessionWithBusiness> {
  return loadMerchantSession(true) as Promise<MerchantSessionWithBusiness>;
}

/** For protected layout — allows add-business onboarding without a merchant yet. */
export async function getMerchantSessionForShell(): Promise<MerchantSessionForShell> {
  return loadMerchantSession(false);
}

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
import type { MerchantStaffRole } from "@repo/supabase/types";
import type { MerchantStaffRow } from "@repo/supabase/queries/merchant-staff";
import {
  getMerchantRoleForUser,
  listMerchantStaff,
} from "@repo/supabase/queries/merchant-staff";
import { getActingStaffUserIdFromCookie } from "@repo/supabase/acting-staff";

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
  role: MerchantStaffRole;
  staff: MerchantStaffRow[];
  actingStaffUserId: string | null;
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

  const [branches, activeBranch, role, staff, actingStaffUserId] =
    await Promise.all([
      getActiveLocationsByMerchantId(merchant.id),
      resolveActiveLocationForMerchant(merchant.id),
      getMerchantRoleForUser(user.id, merchant.id),
      listMerchantStaff(merchant.id),
      getActingStaffUserIdFromCookie(),
    ]);

  return {
    user,
    merchants,
    merchant,
    branches,
    activeBranch,
    role: role ?? "cashier",
    staff,
    actingStaffUserId,
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

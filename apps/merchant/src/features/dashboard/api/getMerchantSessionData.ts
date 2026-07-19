import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerAuthUser } from "@/shared/lib/get-server-auth-user";
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
    Awaited<ReturnType<typeof getServerAuthUser>>["data"]["user"]
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

const loadMerchantSession = cache(
  async (): Promise<MerchantSessionForShell> => {
    const {
      data: { user },
    } = await getServerAuthUser();
    if (!user) {
      redirect("/merchant/login");
    }

    const merchants = await getMerchantsByUserId(user.id);
    if (merchants.length === 0) {
      return {
        user,
        merchants: [],
        merchant: null,
        branches: [],
        activeBranch: null,
      };
    }

    const merchant = await getMerchantByUserId(user.id);
    if (!merchant) {
      return {
        user,
        merchants: [],
        merchant: null,
        branches: [],
        activeBranch: null,
      };
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
    };
  },
);

/** For protected layout — allows add-business onboarding without a merchant yet. */
export async function getMerchantSessionForShell(): Promise<MerchantSessionForShell> {
  return loadMerchantSession();
}

/** Requires an active merchant; redirects to add-business or login when missing. */
export async function getMerchantSessionData(): Promise<MerchantSessionWithBusiness> {
  const session = await loadMerchantSession();
  if (!session.merchant) {
    redirect("/merchant/add-business");
  }
  return session;
}

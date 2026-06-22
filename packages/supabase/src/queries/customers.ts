import { createClient } from "../server";
import { createServiceRoleClient } from "../service-role";
import type { Database } from "../types";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

// TODO: remove this once we have a proper email provider
export function customerAuthEmail(customerId: string): string {
  return `customer+${customerId}@auth.yorewards.internal`;
}

export async function ensureCustomerAuthUser(
  customerId: string,
): Promise<string> {
  const admin = createServiceRoleClient();
  const email = customerAuthEmail(customerId);

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { customer_id: customerId },
  });

  if (!createError) {
    return email;
  }

  const { data: usersData, error: listError } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    throw listError;
  }

  const existing = usersData.users.find((user) => user.email === email);
  if (!existing) {
    throw createError;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    existing.id,
    { app_metadata: { ...existing.app_metadata, customer_id: customerId } },
  );
  if (updateError) {
    throw updateError;
  }

  return email;
}

export async function establishCustomerSession(customerId: string) {
  const admin = createServiceRoleClient();
  const email = await ensureCustomerAuthUser(customerId);

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  if (linkError) {
    throw linkError;
  }

  const tokenHash = linkData.properties.hashed_token;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (error) {
    throw error;
  }

  return data.session;
}

export async function findCustomerByPhone(phone: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function getCustomerById(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function getCustomerIdFromSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const customerId = user.app_metadata?.customer_id;
  if (typeof customerId === "string") return customerId;

  const email = user.email ?? "";
  const match = email.match(/^customer\+([^@]+)@auth\.yorewards\.internal$/);
  return match?.[1] ?? null;
}

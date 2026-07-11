import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createServiceRoleClient } from "../service-role";

export function isUserAlreadyExistsAuthError(
  error: { message?: string } | null | undefined,
): boolean {
  if (!error?.message) return false;
  const lower = error.message.toLowerCase();
  return (
    (lower.includes("already") && lower.includes("registered")) ||
    (lower.includes("already") && lower.includes("exists"))
  );
}

export async function findAuthUserByEmail(
  email: string,
): Promise<User | null> {
  const admin = createServiceRoleClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalized,
    );
    if (match) return match;

    if (data.users.length < 1000) return null;
    page += 1;
  }
}

async function verifyPasswordSignIn(
  email: string,
  password: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const client = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return false;

  await client.auth.signOut();
  return true;
}

/**
 * Creates a merchant auth user for staff invite acceptance, or completes a
 * Supabase invite stub (from inviteUserByEmail) by setting a password.
 * Recreates the auth user when Supabase leaves the record in a state that
 * still rejects password sign-in after an admin password update.
 */
export async function createOrCompleteInviteAuthUser(input: {
  email: string;
  password: string;
}): Promise<{ userId: string }> {
  const admin = createServiceRoleClient();
  const email = input.email.trim().toLowerCase();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

  if (!createError && created.user) {
    return { userId: created.user.id };
  }

  if (!isUserAlreadyExistsAuthError(createError)) {
    throw createError ?? new Error("create_user_failed");
  }

  const existing = await findAuthUserByEmail(email);
  if (!existing) {
    throw createError ?? new Error("create_user_failed");
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    existing.id,
    {
      password: input.password,
      email_confirm: true,
    },
  );

  if (updateError) throw updateError;

  if (await verifyPasswordSignIn(email, input.password)) {
    return { userId: existing.id };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(existing.id);
  if (deleteError) throw deleteError;

  const { data: recreated, error: recreateError } =
    await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

  if (recreateError) throw recreateError;
  if (!recreated.user) throw new Error("recreate_user_failed");

  return { userId: recreated.user.id };
}

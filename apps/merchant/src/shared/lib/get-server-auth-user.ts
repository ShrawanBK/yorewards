import { cache } from "react";
import { createClient } from "@repo/supabase/server";

/** One Supabase auth read per request — avoids duplicate getUser() in RSC trees. */
export const getServerAuthUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});

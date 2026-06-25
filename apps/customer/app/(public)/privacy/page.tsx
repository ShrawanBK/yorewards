import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { PrivacyView } from "@/features/privacy";

export default async function PrivacyPage() {
  const customerId = await getCustomerIdFromSession();

  return (
    <PrivacyView backHref={customerId ? "/profile" : "/login"} signedIn={Boolean(customerId)} />
  );
}

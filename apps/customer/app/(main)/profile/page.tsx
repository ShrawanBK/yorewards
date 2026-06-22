import {
  getCustomerById,
  getCustomerIdFromSession,
} from "@repo/supabase/queries/customers";
import { ProfileScreen } from "@/features/profile";

export default async function ProfilePage() {
  const customerId = await getCustomerIdFromSession();
  const customer = customerId ? await getCustomerById(customerId) : null;

  return (
    <ProfileScreen
      customer={
        customer
          ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
            }
          : null
      }
    />
  );
}

import type { CustomerProfile } from "@/features/auth/types/auth.types";
import { ProfileView } from "./ProfileView";

export function ProfileScreen({
  customer,
}: {
  customer: CustomerProfile | null;
}) {
  return <ProfileView customer={customer} />;
}

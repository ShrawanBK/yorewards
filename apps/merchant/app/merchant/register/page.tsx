import { redirect } from "next/navigation";

export default function MerchantRegisterPage() {
  redirect("/merchant/login?tab=signup");
}

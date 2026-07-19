import { Suspense } from "react";
import { VerifyEmailView } from "@/features/auth/components/VerifyEmailView";

export default function MerchantVerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}

import { CustomerAuthLayout } from "@/widgets/CustomerAuthLayout";
import { OnboardingView } from "@/features/auth";

export default function OnboardingPage() {
  return (
    <CustomerAuthLayout>
      <OnboardingView />
    </CustomerAuthLayout>
  );
}

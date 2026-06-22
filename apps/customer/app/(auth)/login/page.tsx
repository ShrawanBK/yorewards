import { CustomerAuthLayout } from "@/widgets/CustomerAuthLayout";
import { LoginView } from "@/features/auth";

export default function LoginPage() {
  return (
    <CustomerAuthLayout>
      <LoginView />
    </CustomerAuthLayout>
  );
}

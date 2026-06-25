import { CustomerAuthLayout } from "@/widgets/CustomerAuthLayout";
import { LoginAuthExtras, LoginView } from "@/features/auth";

export default function LoginPage() {
  return (
    <CustomerAuthLayout>
      <div className="flex w-full max-w-md flex-col gap-4">
        <LoginView />
        <LoginAuthExtras />
      </div>
    </CustomerAuthLayout>
  );
}

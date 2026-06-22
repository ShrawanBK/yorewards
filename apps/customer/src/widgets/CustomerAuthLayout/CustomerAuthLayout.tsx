import { LoginView } from "@/features/auth";

export async function CustomerAuthLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-surface p-6">
      {children ?? <LoginView />}
    </div>
  );
}

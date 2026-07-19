import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@repo/supabase/server";
import { getPendingStaffInvitesForEmail } from "@repo/supabase/queries/merchant-staff";
import { resolvePostAuthRedirect } from "@/features/auth/api/resolvePostAuthRedirect";
import { AcceptInviteForm } from "@/features/auth/components/AcceptInviteForm";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export async function AcceptInviteView({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = (params.email ?? "").trim().toLowerCase();
  const t = await getTranslations("acceptInvite");

  if (!email) {
    return (
      <div className="merchant-glass-card rounded-xl p-6">
        <h1 className="text-xl font-semibold text-foreground">{t("missingEmailTitle")}</h1>
        <p className="merchant-body-muted mt-2">{t("missingEmailBody")}</p>
      </div>
    );
  }

  const invites = await getPendingStaffInvitesForEmail(email);
  if (invites.length === 0) {
    return (
      <div className="merchant-glass-card rounded-xl p-6">
        <h1 className="text-xl font-semibold text-foreground">{t("notFoundTitle")}</h1>
        <p className="merchant-body-muted mt-2">{t("notFoundBody")}</p>
      </div>
    );
  }

  const roles = [...new Set(invites.map((invite) => invite.role))];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email?.trim().toLowerCase() === email) {
    redirect(await resolvePostAuthRedirect(user.id, email));
  }

  return (
    <div className="space-y-6">
      <p className="merchant-body-muted">{t("subtitle", { email })}</p>
      <p className="merchant-body-muted text-sm">
        {t("roleHint", { roles: roles.join(", ") })}
      </p>
      <AcceptInviteForm invitedEmail={email} defaultTab="signup" />
    </div>
  );
}

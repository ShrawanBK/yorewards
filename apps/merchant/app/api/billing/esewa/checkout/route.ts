import { NextResponse } from "next/server";
import { completeEsewaSandboxCheckout } from "@/features/billing/api/billingActions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const merchantId = searchParams.get("merchantId");
  const ref = searchParams.get("ref");

  if (!merchantId || !ref) {
    return NextResponse.redirect(
      `${origin}/merchant/billing?error=checkout`,
    );
  }

  const result = await completeEsewaSandboxCheckout({
    merchantId,
    providerReference: ref,
  });

  if (result.error) {
    return NextResponse.redirect(
      `${origin}/merchant/billing?error=${result.error.code}`,
    );
  }

  return NextResponse.redirect(`${origin}/merchant/billing?success=trial`);
}

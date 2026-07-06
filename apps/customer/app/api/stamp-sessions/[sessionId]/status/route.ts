import { NextResponse } from "next/server";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSessionForCustomer } from "@repo/supabase/queries/stamps";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;
  const customerId = await getCustomerIdFromSession();

  if (!customerId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }

  try {
    const session = await getStampSessionForCustomer(sessionId, customerId);
    if (!session) {
      return NextResponse.json(
        { error: { code: "STAMP_SESSION_NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: session.status,
      rejectionReason: session.rejection_reason ?? null,
      customerCardId: session.customer_card_id,
    });
  } catch {
    return NextResponse.json({ error: { code: "UNKNOWN" } }, { status: 500 });
  }
}

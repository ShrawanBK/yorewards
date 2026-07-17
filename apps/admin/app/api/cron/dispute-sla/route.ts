import { NextResponse } from "next/server";
import { runDisputeSlaBreachJob } from "@repo/supabase/notifications/dispatch";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await runDisputeSlaBreachJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/dispute-sla]", err);
    return NextResponse.json({ error: "CRON_FAILED" }, { status: 500 });
  }
}

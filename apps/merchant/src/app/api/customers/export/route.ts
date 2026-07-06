import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import {
  getMerchantByUserId,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import {
  getMerchantCustomers,
  merchantCanExportCsv,
} from "@repo/supabase/queries/merchant-customers";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const merchants = await getMerchantsByUserId(user.id);
  const merchant = await getMerchantByUserId(user.id);
  if (!merchant || !merchants.some((m) => m.id === merchant.id)) {
    return NextResponse.json({ error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  if (!merchantCanExportCsv(merchant.subscription_tier)) {
    return NextResponse.json({ error: "CSV_EXPORT_NOT_ALLOWED" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const branch = searchParams.get("branch");
  const locationId = branch && branch !== "all" ? branch : null;

  try {
    const customers = await getMerchantCustomers(merchant.id, locationId);
    const header = [
      "name",
      "phone",
      "segment",
      "total_spend",
      "currency",
      "visits",
      "stamps",
      "last_visit",
    ].join(",");

    const rows = customers.map((c) =>
      [
        csvEscape(c.customerName ?? ""),
        csvEscape(c.phone),
        csvEscape(c.segment),
        csvEscape(c.totalSpend),
        csvEscape(c.currency),
        csvEscape(c.visitCount),
        csvEscape(`${c.currentStamps}/${c.stampTarget}`),
        csvEscape(c.lastStampedAt ?? ""),
      ].join(","),
    );

    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers-${merchant.id.slice(0, 8)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "CSV_EXPORT_FAILED" }, { status: 500 });
  }
}

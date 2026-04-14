import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Returns current pot balances by summing all ledger entries per pot.
 */
export async function GET() {
  try {
    const { data: officeLedger, error: officeErr } = await supabaseAdmin
      .from("incentive_ledger")
      .select("amount")
      .eq("pot", "office");

    if (officeErr) throw officeErr;

    const { data: techLedger, error: techErr } = await supabaseAdmin
      .from("incentive_ledger")
      .select("amount")
      .eq("pot", "tech");

    if (techErr) throw techErr;

    const officeBalance = (officeLedger ?? []).reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const techBalance = (techLedger ?? []).reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    return NextResponse.json({
      office: Math.round(officeBalance * 100) / 100,
      tech: Math.round(techBalance * 100) / 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

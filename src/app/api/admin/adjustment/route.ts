import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pot, amount, reason } = await request.json();

    if (!pot || !["office", "tech"].includes(pot)) {
      return NextResponse.json({ error: "Invalid pot" }, { status: 400 });
    }
    if (!amount || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Amount must be a non-zero number" },
        { status: 400 }
      );
    }
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("incentive_ledger")
      .insert({
        pot,
        amount: Math.abs(amount),
        reason: reason.trim(),
        source_type: "adjustment",
        source_id: null,
        new_since_last_display: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, entry: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

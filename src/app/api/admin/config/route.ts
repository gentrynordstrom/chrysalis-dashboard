import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("incentive_config")
    .select("*")
    .order("pot")
    .order("turnover_type")
    .order("rule_key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, day_threshold, amount } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Config ID required" }, { status: 400 });
    }

    const updates: Record<string, number> = {};
    if (typeof day_threshold === "number") updates.day_threshold = day_threshold;
    if (typeof amount === "number") updates.amount = amount;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("incentive_config")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

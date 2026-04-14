import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Returns ledger history with optional pot filter and pagination.
 * Query params: ?pot=office|tech&limit=50&offset=0
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pot = url.searchParams.get("pot");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    let query = supabaseAdmin
      .from("incentive_ledger")
      .select("*", { count: "exact" })
      .neq("amount", 0)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (pot === "office" || pot === "tech") {
      query = query.eq("pot", pot);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      entries: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

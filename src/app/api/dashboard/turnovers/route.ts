import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Returns turnovers for the dashboard.
 * Query params: ?status=active|completed&limit=50
 *
 * "active" returns turnovers where deposit_status is NOT "deposit received"
 * "completed" returns the last N completed turnovers with incentive info
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "active";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "50"),
      200
    );

    if (status === "active") {
      const { data, error } = await supabaseAdmin
        .from("turnovers")
        .select("*")
        .or(
          "deposit_status.is.null,deposit_status.not.ilike.%deposit received%"
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return NextResponse.json({ turnovers: data ?? [] });
    }

    // Completed turnovers
    const { data, error } = await supabaseAdmin
      .from("turnovers")
      .select("*")
      .ilike("deposit_status", "%deposit received%")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ turnovers: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

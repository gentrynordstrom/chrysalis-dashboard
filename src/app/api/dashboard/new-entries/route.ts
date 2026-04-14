import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * GET: Returns ledger entries flagged as new_since_last_display.
 * Used by the frontend to trigger jar animations and audio.
 *
 * POST: Marks entries as displayed (clears the new flag).
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("incentive_ledger")
      .select("*")
      .eq("new_since_last_display", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entryIds: string[] = body.entry_ids ?? [];

    if (entryIds.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const { error, count } = await supabaseAdmin
      .from("incentive_ledger")
      .update({ new_since_last_display: false })
      .in("id", entryIds);

    if (error) throw error;
    return NextResponse.json({ updated: count ?? entryIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

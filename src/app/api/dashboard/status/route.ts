import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * Returns sync status for all data sources.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("data_sources")
      .select("*")
      .order("name");

    if (error) throw error;
    return NextResponse.json({ sources: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

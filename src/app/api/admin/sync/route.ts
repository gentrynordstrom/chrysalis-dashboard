import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { runFullSync } from "@/lib/sync/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin-authenticated sync trigger. Called from the admin UI.
 * Supports ?board=turnovers|work_orders for partial syncs.
 */
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const board = url.searchParams.get("board");

  try {
    const result = await runFullSync({
      turnoversOnly: board === "turnovers",
      workOrdersOnly: board === "work_orders",
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { runFullSync } from "@/lib/sync/orchestrator";
import { isAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Manual sync trigger. Supports ?board=turnovers|work_orders to sync
 * a single board (faster, avoids timeout), or no param for full sync.
 *
 * Accepts either a CRON_SECRET bearer token (for cron jobs) or an
 * authenticated admin session cookie (for manual triggers from the UI).
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const hasValidCronAuth =
    cronSecret && authHeader === `Bearer ${cronSecret}`;
  const hasAdminSession = await isAuthenticated();

  if (!hasValidCronAuth && !hasAdminSession) {
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

export const maxDuration = 60;

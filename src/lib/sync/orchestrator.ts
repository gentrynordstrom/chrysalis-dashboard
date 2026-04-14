import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchAllTurnovers, fetchAllWorkOrders } from "@/lib/monday/fetcher";
import { transformTurnover, transformWorkOrder } from "@/lib/monday/transform";
import { upsertTurnovers, upsertWorkOrders } from "./upsert";
import { runIncentiveRules, type RulesEngineResult } from "@/lib/rules/engine";

export interface SyncResult {
  turnoversProcessed: number;
  workOrdersProcessed: number;
  rulesResult: RulesEngineResult;
  durationMs: number;
  errors: string[];
}

async function updateDataSource(
  name: string,
  status: "ok" | "error" | "syncing",
  errorLog?: string
) {
  const update: Record<string, unknown> = {
    sync_status: status,
    error_log: errorLog ?? null,
  };

  if (status === "ok") {
    update.last_synced_at = new Date().toISOString();
  }

  await supabaseAdmin.from("data_sources").update(update).eq("name", name);
}

/**
 * Full sync pipeline:
 * 1. Fetch from Monday.com (both boards)
 * 2. Transform to internal models
 * 3. Upsert to database
 * 4. Run incentive rules engine
 * 5. Update data source metadata
 */
export async function runFullSync(): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let turnoversProcessed = 0;
  let workOrdersProcessed = 0;

  // Mark both sources as syncing
  await Promise.all([
    updateDataSource("monday_turnovers", "syncing"),
    updateDataSource("monday_work_orders", "syncing"),
  ]);

  // Step 1+2: Fetch and transform turnovers
  try {
    const mondayTurnovers = await fetchAllTurnovers();
    const turnoverRecords = mondayTurnovers.map(transformTurnover);
    const result = await upsertTurnovers(turnoverRecords);
    turnoversProcessed = result.total;
    await updateDataSource("monday_turnovers", "ok");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Turnover sync failed: ${msg}`);
    await updateDataSource("monday_turnovers", "error", msg);
  }

  // Step 1+2: Fetch and transform work orders
  try {
    const mondayWorkOrders = await fetchAllWorkOrders();
    const workOrderRecords = mondayWorkOrders.map(transformWorkOrder);
    const result = await upsertWorkOrders(workOrderRecords);
    workOrdersProcessed = result.total;
    await updateDataSource("monday_work_orders", "ok");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Work order sync failed: ${msg}`);
    await updateDataSource("monday_work_orders", "error", msg);
  }

  // Step 3: Run incentive rules engine
  let rulesResult: RulesEngineResult = {
    officeEntries: 0,
    techTurnoverEntries: 0,
    reviewEntries: 0,
    totalNewEntries: 0,
  };

  try {
    rulesResult = await runIncentiveRules();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Rules engine failed: ${msg}`);
  }

  return {
    turnoversProcessed,
    workOrdersProcessed,
    rulesResult,
    durationMs: Date.now() - start,
    errors,
  };
}

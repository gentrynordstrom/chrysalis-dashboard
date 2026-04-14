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

export interface SyncOptions {
  turnoversOnly?: boolean;
  workOrdersOnly?: boolean;
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

export async function runFullSync(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  let turnoversProcessed = 0;
  let workOrdersProcessed = 0;

  const syncTurnovers = !options.workOrdersOnly;
  const syncWorkOrders = !options.turnoversOnly;

  if (syncTurnovers) {
    await updateDataSource("monday_turnovers", "syncing");
    try {
      const mondayTurnovers = await fetchAllTurnovers();
      console.log(`Fetched ${mondayTurnovers.length} turnovers from Monday`);
      const turnoverRecords = mondayTurnovers.map(transformTurnover);
      const result = await upsertTurnovers(turnoverRecords);
      turnoversProcessed = result.total;
      await updateDataSource("monday_turnovers", "ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Turnover sync failed: ${msg}`);
      await updateDataSource("monday_turnovers", "error", msg);
    }
  }

  if (syncWorkOrders) {
    await updateDataSource("monday_work_orders", "syncing");
    try {
      const mondayWorkOrders = await fetchAllWorkOrders({ maxPages: 20 });
      console.log(
        `Fetched ${mondayWorkOrders.length} work orders from Monday`
      );
      const workOrderRecords = mondayWorkOrders.map(transformWorkOrder);
      const result = await upsertWorkOrders(workOrderRecords);
      workOrdersProcessed = result.total;
      await updateDataSource("monday_work_orders", "ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Work order sync failed: ${msg}`);
      await updateDataSource("monday_work_orders", "error", msg);
    }
  }

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

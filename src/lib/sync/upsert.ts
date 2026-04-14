import { supabaseAdmin } from "@/lib/supabase/server";

interface TurnoverUpsert {
  monday_item_id: number;
  unit_name: string | null;
  turnover_type: string | null;
  key_turnin_date: string | null;
  deposit_received_date: string | null;
  deposit_status: string | null;
  work_start_date: string | null;
  work_completion_date: string | null;
  is_billed: boolean;
  status: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
}

interface WorkOrderUpsert {
  monday_item_id: number;
  tech_rating: number | null;
  quality_rating: number | null;
  assigned_tech: string | null;
  completion_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  turnover_monday_item_id: number | null;
}

/**
 * Upserts turnovers into the database by monday_item_id.
 * Processes in batches to stay within Supabase limits.
 */
export async function upsertTurnovers(records: TurnoverUpsert[]) {
  if (records.length === 0) return { total: 0 };

  const BATCH_SIZE = 50;
  let total = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const { error } = await supabaseAdmin
      .from("turnovers")
      .upsert(batch, { onConflict: "monday_item_id" });

    if (error) {
      throw new Error(`Failed to upsert turnovers batch ${i}: ${error.message}`);
    }

    total += batch.length;
  }

  return { total };
}

/**
 * Upserts work order reviews. Resolves turnover_id from the board relation's
 * monday_item_id before inserting.
 */
export async function upsertWorkOrders(records: WorkOrderUpsert[]) {
  if (records.length === 0) return { total: 0 };

  const turnoverMondayIds = records
    .map((r) => r.turnover_monday_item_id)
    .filter((id): id is number => id !== null);

  let turnoverIdMap = new Map<number, string>();

  if (turnoverMondayIds.length > 0) {
    const { data: turnovers } = await supabaseAdmin
      .from("turnovers")
      .select("id, monday_item_id")
      .in("monday_item_id", turnoverMondayIds);

    if (turnovers) {
      turnoverIdMap = new Map(
        turnovers.map((t) => [t.monday_item_id, t.id])
      );
    }
  }

  const upsertRecords = records.map((r) => {
    const { turnover_monday_item_id, ...rest } = r;
    return {
      ...rest,
      review_bonus:
        r.tech_rating === 5 && r.quality_rating === 5 ? 10.0 : 0,
      turnover_id: turnover_monday_item_id
        ? (turnoverIdMap.get(turnover_monday_item_id) ?? null)
        : null,
    };
  });

  const BATCH_SIZE = 50;
  let total = 0;

  for (let i = 0; i < upsertRecords.length; i += BATCH_SIZE) {
    const batch = upsertRecords.slice(i, i + BATCH_SIZE);

    const { error } = await supabaseAdmin
      .from("work_order_reviews")
      .upsert(batch, { onConflict: "monday_item_id" });

    if (error) {
      throw new Error(
        `Failed to upsert work orders batch ${i}: ${error.message}`
      );
    }

    total += batch.length;
  }

  return { total };
}

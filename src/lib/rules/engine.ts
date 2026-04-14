import { supabaseAdmin } from "@/lib/supabase/server";
import type { IncentiveConfig, PotType } from "@/types/database";

interface LedgerInsert {
  pot: PotType;
  amount: number;
  reason: string;
  source_type: string;
  source_id: string;
}

type ConfigMap = Map<string, IncentiveConfig>;

async function loadConfig(): Promise<ConfigMap> {
  const { data, error } = await supabaseAdmin
    .from("incentive_config")
    .select("*");

  if (error) throw new Error(`Failed to load incentive config: ${error.message}`);

  const map = new Map<string, IncentiveConfig>();
  for (const row of data ?? []) {
    const key = `${row.pot}:${row.turnover_type}:${row.rule_key}`;
    map.set(key, row as IncentiveConfig);
  }
  return map;
}

/**
 * Returns existing ledger source_ids to avoid duplicate entries.
 */
async function getExistingLedgerSourceIds(
  sourceType: string,
  sourceIds: string[]
): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set();

  const { data } = await supabaseAdmin
    .from("incentive_ledger")
    .select("source_id")
    .eq("source_type", sourceType)
    .in("source_id", sourceIds);

  return new Set((data ?? []).map((r) => r.source_id));
}

/**
 * Evaluates the office pot for all turnovers where deposit_status = "deposit received"
 * and is_billed = true. Creates ledger entries for qualifying turnovers that
 * haven't been recorded yet.
 */
async function evaluateOfficePot(config: ConfigMap): Promise<LedgerInsert[]> {
  const { data: turnovers, error } = await supabaseAdmin
    .from("turnovers")
    .select("*")
    .ilike("deposit_status", "%deposit received%")
    .eq("is_billed", true)
    .not("key_turnin_date", "is", null)
    .not("turnover_type", "is", null);

  if (error) throw new Error(`Office pot query failed: ${error.message}`);
  if (!turnovers?.length) return [];

  const turnoverIds = turnovers.map((t) => t.id);
  const existingIds = await getExistingLedgerSourceIds("turnover", turnoverIds);

  // Also check for entries specifically tagged as office pot
  const { data: existingOffice } = await supabaseAdmin
    .from("incentive_ledger")
    .select("source_id")
    .eq("source_type", "turnover")
    .eq("pot", "office")
    .in("source_id", turnoverIds);

  const existingOfficeIds = new Set(
    (existingOffice ?? []).map((r) => r.source_id)
  );

  const entries: LedgerInsert[] = [];

  for (const turnover of turnovers) {
    if (existingOfficeIds.has(turnover.id)) continue;

    const officeDays = turnover.office_days;
    if (officeDays === null || officeDays === undefined) continue;

    const configKey = `office:${turnover.turnover_type}:base`;
    const rule = config.get(configKey);
    if (!rule) continue;

    if (officeDays <= rule.day_threshold) {
      entries.push({
        pot: "office",
        amount: Number(rule.amount),
        reason: `${capitalize(turnover.turnover_type)} turnover - ${turnover.unit_name ?? "Unknown"} (${officeDays} days)`,
        source_type: "turnover",
        source_id: turnover.id,
      });
    }
  }

  return entries;
}

/**
 * Evaluates the tech pot turnover bonuses: base amount + optional 20% kicker
 * when actual_hours <= estimated_hours.
 */
async function evaluateTechTurnoverPot(
  config: ConfigMap
): Promise<LedgerInsert[]> {
  const { data: turnovers, error } = await supabaseAdmin
    .from("turnovers")
    .select("*")
    .not("work_completion_date", "is", null)
    .not("work_start_date", "is", null)
    .not("turnover_type", "is", null);

  if (error) throw new Error(`Tech pot turnover query failed: ${error.message}`);
  if (!turnovers?.length) return [];

  const turnoverIds = turnovers.map((t) => t.id);

  const { data: existingTech } = await supabaseAdmin
    .from("incentive_ledger")
    .select("source_id")
    .eq("source_type", "turnover")
    .eq("pot", "tech")
    .in("source_id", turnoverIds);

  const existingTechIds = new Set(
    (existingTech ?? []).map((r) => r.source_id)
  );

  const entries: LedgerInsert[] = [];

  for (const turnover of turnovers) {
    if (existingTechIds.has(turnover.id)) continue;

    const techDays = turnover.tech_days;
    if (techDays === null || techDays === undefined) continue;

    const baseKey = `tech:${turnover.turnover_type}:base`;
    const baseRule = config.get(baseKey);
    if (!baseRule) continue;

    if (techDays <= baseRule.day_threshold) {
      let totalAmount = Number(baseRule.amount);
      let kickerNote = "";

      const kickerKey = `tech:${turnover.turnover_type}:kicker`;
      const kickerRule = config.get(kickerKey);

      if (
        kickerRule &&
        turnover.actual_hours !== null &&
        turnover.estimated_hours !== null &&
        turnover.actual_hours <= turnover.estimated_hours
      ) {
        totalAmount += Number(kickerRule.amount);
        kickerNote = " + 20% kicker";
      }

      entries.push({
        pot: "tech",
        amount: totalAmount,
        reason: `${capitalize(turnover.turnover_type)} turnover - ${turnover.unit_name ?? "Unknown"} (${techDays} days${kickerNote})`,
        source_type: "turnover",
        source_id: turnover.id,
      });
    }
  }

  return entries;
}

/**
 * Evaluates 5-star review bonuses. Both tech_rating and quality_rating
 * must be 5 for the $10 bonus to apply.
 */
async function evaluateReviewPot(): Promise<LedgerInsert[]> {
  const { data: reviews, error } = await supabaseAdmin
    .from("work_order_reviews")
    .select("*")
    .eq("tech_rating", 5)
    .eq("quality_rating", 5);

  if (error) throw new Error(`Review pot query failed: ${error.message}`);
  if (!reviews?.length) return [];

  const reviewIds = reviews.map((r) => r.id);

  const { data: existingReviews } = await supabaseAdmin
    .from("incentive_ledger")
    .select("source_id")
    .eq("source_type", "review")
    .in("source_id", reviewIds);

  const existingReviewIds = new Set(
    (existingReviews ?? []).map((r) => r.source_id)
  );

  const entries: LedgerInsert[] = [];

  for (const review of reviews) {
    if (existingReviewIds.has(review.id)) continue;

    entries.push({
      pot: "tech",
      amount: 10.0,
      reason: `5-star review${review.assigned_tech ? ` - ${review.assigned_tech}` : ""}`,
      source_type: "review",
      source_id: review.id,
    });
  }

  return entries;
}

function capitalize(s: string | null): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Writes ledger entries, also updating the corresponding incentive amounts
 * on turnovers for reference.
 */
async function writeLedgerEntries(entries: LedgerInsert[]): Promise<number> {
  if (entries.length === 0) return 0;

  const { error } = await supabaseAdmin
    .from("incentive_ledger")
    .insert(
      entries.map((e) => ({
        ...e,
        new_since_last_display: true,
      }))
    );

  if (error) {
    // Handle unique constraint violations gracefully (idempotency)
    if (error.code === "23505") {
      console.warn("Some ledger entries already existed, skipping duplicates");
      let written = 0;
      for (const entry of entries) {
        const { error: singleError } = await supabaseAdmin
          .from("incentive_ledger")
          .insert({ ...entry, new_since_last_display: true });
        if (!singleError) written++;
      }
      return written;
    }
    throw new Error(`Failed to write ledger entries: ${error.message}`);
  }

  // Update turnover incentive amount fields for reference
  for (const entry of entries) {
    if (entry.source_type === "turnover" && entry.source_id) {
      const field =
        entry.pot === "office"
          ? "office_incentive_amount"
          : "tech_incentive_amount";

      await supabaseAdmin
        .from("turnovers")
        .update({ [field]: entry.amount })
        .eq("id", entry.source_id);
    }
  }

  return entries.length;
}

export interface RulesEngineResult {
  officeEntries: number;
  techTurnoverEntries: number;
  reviewEntries: number;
  totalNewEntries: number;
}

/**
 * Main entry point: runs all incentive evaluations and writes new ledger entries.
 */
export async function runIncentiveRules(): Promise<RulesEngineResult> {
  const config = await loadConfig();

  const [officeEntries, techTurnoverEntries, reviewEntries] = await Promise.all(
    [evaluateOfficePot(config), evaluateTechTurnoverPot(config), evaluateReviewPot()]
  );

  const allEntries = [
    ...officeEntries,
    ...techTurnoverEntries,
    ...reviewEntries,
  ];

  const totalWritten = await writeLedgerEntries(allEntries);

  return {
    officeEntries: officeEntries.length,
    techTurnoverEntries: techTurnoverEntries.length,
    reviewEntries: reviewEntries.length,
    totalNewEntries: totalWritten,
  };
}

import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Condition {
  label: string;
  passed: boolean;
  actual: string;
  expected: string;
}

/**
 * Looks up a turnover by unit name and evaluates every office-pot bonus
 * condition individually, returning pass/fail plus the raw DB values.
 *
 * GET /api/admin/diagnose?unit=2417+circle
 */
export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const unit = url.searchParams.get("unit")?.trim();
  const targetId = url.searchParams.get("id")?.trim();

  if (!unit && !targetId) {
    return NextResponse.json(
      { error: "Missing ?unit= or ?id= query parameter" },
      { status: 400 }
    );
  }

  let turnovers: Record<string, unknown>[] | null = null;
  let lookupErr: { message: string } | null = null;

  if (targetId) {
    // Target a specific turnover by UUID
    const result = await supabaseAdmin
      .from("turnovers")
      .select("*")
      .eq("id", targetId)
      .limit(1);
    turnovers = result.data;
    lookupErr = result.error;
  } else {
    // Fuzzy-match by unit name. Order so the most recently active turnover
    // (most recent work_start_date, then key_turnin_date, then created_at) is first.
    const result = await supabaseAdmin
      .from("turnovers")
      .select("*")
      .ilike("unit_name", `%${unit!}%`)
      .order("work_start_date", { ascending: false, nullsFirst: false })
      .order("key_turnin_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5);
    turnovers = result.data;
    lookupErr = result.error;
  }

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  }

  if (!turnovers?.length) {
    return NextResponse.json(
      { error: `No turnovers found matching "${unit ?? targetId}"`, matches: [] },
      { status: 404 }
    );
  }

  const turnover = turnovers[0] as Record<string, unknown>;

  // Load the incentive_config for this turnover's type
  let configThreshold: number | null = null;
  let configAmount: number | null = null;

  if (turnover.turnover_type) {
    const { data: cfg } = await supabaseAdmin
      .from("incentive_config")
      .select("*")
      .eq("pot", "office")
      .eq("turnover_type", turnover.turnover_type)
      .eq("rule_key", "base")
      .single();

    if (cfg) {
      configThreshold = cfg.day_threshold;
      configAmount = Number(cfg.amount);
    }
  }

  // Check for existing office-pot ledger entry
  const { data: existingEntry } = await supabaseAdmin
    .from("incentive_ledger")
    .select("id, amount, reason, created_at")
    .eq("source_type", "turnover")
    .eq("pot", "office")
    .eq("source_id", turnover.id)
    .maybeSingle();

  // Evaluate each condition individually
  const depositStatusMatches =
    typeof turnover.deposit_status === "string" &&
    turnover.deposit_status.toLowerCase().includes("deposit received");

  const conditions: Condition[] = [
    {
      label: "deposit_status contains \"deposit received\"",
      passed: depositStatusMatches,
      actual: turnover.deposit_status ?? "(null)",
      expected: "Contains \"deposit received\" (case-insensitive)",
    },
    {
      label: "is_billed is true",
      passed: turnover.is_billed === true,
      actual: String(turnover.is_billed),
      expected: "true",
    },
    {
      label: "key_turnin_date is set",
      passed: turnover.key_turnin_date !== null,
      actual: turnover.key_turnin_date ?? "(null)",
      expected: "Any date",
    },
    {
      label: "deposit_received_date is set",
      passed: turnover.deposit_received_date !== null,
      actual: turnover.deposit_received_date ?? "(null)",
      expected: "Any date",
    },
    {
      label: "turnover_type is set",
      passed: turnover.turnover_type !== null,
      actual: turnover.turnover_type ?? "(null)",
      expected: "light | medium | heavy",
    },
    {
      label: "office_days within threshold",
      passed:
        turnover.office_days !== null &&
        configThreshold !== null &&
        turnover.office_days <= configThreshold,
      actual:
        turnover.office_days !== null
          ? `${turnover.office_days} days`
          : "(null — needs both dates)",
      expected:
        configThreshold !== null
          ? `≤ ${configThreshold} days`
          : "(no config found for this turnover_type)",
    },
    {
      label: "No existing office ledger entry",
      passed: !existingEntry,
      actual: existingEntry
        ? `Entry exists: $${Number(existingEntry.amount).toFixed(2)} — "${existingEntry.reason}" (${existingEntry.created_at})`
        : "None",
      expected: "No prior entry",
    },
  ];

  const allPassed = conditions.every((c) => c.passed);

  return NextResponse.json({
    turnover: {
      id: turnover.id,
      monday_item_id: turnover.monday_item_id,
      unit_name: turnover.unit_name,
      turnover_type: turnover.turnover_type,
      deposit_status: turnover.deposit_status,
      is_billed: turnover.is_billed,
      key_turnin_date: turnover.key_turnin_date,
      deposit_received_date: turnover.deposit_received_date,
      work_start_date: turnover.work_start_date,
      work_completion_date: turnover.work_completion_date,
      office_days: turnover.office_days,
      office_incentive_amount: turnover.office_incentive_amount,
      status: turnover.status,
      updated_at: turnover.updated_at,
    },
    config: configThreshold !== null
      ? { day_threshold: configThreshold, amount: configAmount }
      : null,
    conditions,
    allPassed,
    existingLedgerEntry: existingEntry ?? null,
    // All turnovers matching this unit name, sorted most-recent-first.
    // The first entry is the one being diagnosed above.
    allMatches: turnovers.map((t: Record<string, unknown>, i: number) => ({
      id: t.id,
      unit_name: t.unit_name,
      work_start_date: t.work_start_date ?? null,
      key_turnin_date: t.key_turnin_date ?? null,
      status: t.status ?? null,
      isCurrent: i === 0,
    })),
  });
}

"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface PotBalances {
  office: number;
  tech: number;
}

export interface LedgerEntry {
  id: string;
  pot: "office" | "tech";
  amount: number;
  reason: string;
  source_type: string;
  source_id: string | null;
  new_since_last_display: boolean;
  created_at: string;
}

export interface Turnover {
  id: string;
  monday_item_id: number;
  unit_name: string | null;
  turnover_type: "light" | "medium" | "heavy" | null;
  key_turnin_date: string | null;
  deposit_received_date: string | null;
  deposit_status: string | null;
  work_start_date: string | null;
  work_completion_date: string | null;
  is_billed: boolean;
  status: string | null;
  office_days: number | null;
  tech_days: number | null;
  office_incentive_amount: number | null;
  tech_incentive_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  last_synced_at: string | null;
  sync_status: string;
  error_log: string | null;
}

export function useBalances(refreshInterval = 30000) {
  return useSWR<PotBalances>("/api/dashboard/balances", fetcher, {
    refreshInterval,
  });
}

export function useLedger(pot?: string, limit = 50) {
  const params = new URLSearchParams();
  if (pot) params.set("pot", pot);
  params.set("limit", String(limit));

  return useSWR<{ entries: LedgerEntry[]; total: number }>(
    `/api/dashboard/ledger?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );
}

export function useTurnovers(status: "active" | "completed" = "active", limit = 50) {
  return useSWR<{ turnovers: Turnover[] }>(
    `/api/dashboard/turnovers?status=${status}&limit=${limit}`,
    fetcher,
    { refreshInterval: 30000 }
  );
}

export function useNewEntries(refreshInterval = 10000) {
  return useSWR<{ entries: LedgerEntry[] }>(
    "/api/dashboard/new-entries",
    fetcher,
    { refreshInterval }
  );
}

export function useSyncStatus(refreshInterval = 30000) {
  return useSWR<{ sources: DataSource[] }>(
    "/api/dashboard/status",
    fetcher,
    { refreshInterval }
  );
}

export async function markEntriesDisplayed(entryIds: string[]) {
  if (entryIds.length === 0) return;
  await fetch("/api/dashboard/new-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry_ids: entryIds }),
  });
}

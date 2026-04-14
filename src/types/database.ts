export type TurnoverType = "light" | "medium" | "heavy";
export type PotType = "office" | "tech";
export type LedgerSourceType =
  | "turnover"
  | "review"
  | "manual_withdrawal"
  | "adjustment";
export type SyncStatus = "ok" | "error" | "syncing";

export interface Turnover {
  id: string;
  monday_item_id: number;
  unit_name: string | null;
  turnover_type: TurnoverType | null;
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
  estimated_hours: number | null;
  actual_hours: number | null;
  kicker_earned: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderReview {
  id: string;
  monday_item_id: number;
  tech_rating: number | null;
  quality_rating: number | null;
  review_bonus: number | null;
  assigned_tech: string | null;
  completion_date: string | null;
  turnover_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  pot: PotType;
  amount: number;
  reason: string;
  source_type: LedgerSourceType;
  source_id: string | null;
  new_since_last_display: boolean;
  created_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  error_log: string | null;
}

export interface IncentiveConfig {
  id: string;
  pot: PotType;
  turnover_type: TurnoverType;
  rule_key: string;
  day_threshold: number;
  amount: number;
  updated_at: string;
}

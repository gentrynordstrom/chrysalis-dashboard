-- Enum types for the incentive dashboard

CREATE TYPE turnover_type AS ENUM ('light', 'medium', 'heavy');
CREATE TYPE pot_type AS ENUM ('office', 'tech');
CREATE TYPE ledger_source_type AS ENUM ('turnover', 'review', 'manual_withdrawal', 'adjustment');
CREATE TYPE sync_status_type AS ENUM ('ok', 'error', 'syncing');

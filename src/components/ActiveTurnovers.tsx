"use client";

import { useTurnovers, type Turnover } from "@/hooks/use-dashboard";

function getDaysElapsed(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days < 0 ? null : days;
}

function getThreshold(type: string | null): number {
  switch (type) {
    case "light": return 21;
    case "medium": return 25;
    case "heavy": return 30;
    default: return 25;
  }
}

function getStatusColor(days: number | null, type: string | null): string {
  if (days === null) return "bg-gray-500";
  const threshold = getThreshold(type);

  if (days <= threshold * 0.6) return "bg-emerald-500";
  if (days <= threshold * 0.85) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusRing(days: number | null, type: string | null): string {
  if (days === null) return "ring-gray-500/30";
  const threshold = getThreshold(type);

  if (days <= threshold * 0.6) return "ring-emerald-500/30";
  if (days <= threshold * 0.85) return "ring-amber-500/30";
  return "ring-red-500/30";
}

function TurnoverRow({ turnover, tvMode }: { turnover: Turnover; tvMode?: boolean }) {
  const days = getDaysElapsed(turnover.key_turnin_date);
  const dotColor = getStatusColor(days, turnover.turnover_type);
  const ringColor = getStatusRing(days, turnover.turnover_type);
  const threshold = getThreshold(turnover.turnover_type);

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors ${tvMode ? "text-lg" : "text-sm"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${dotColor} ${ringColor}`} />
        <span className="text-white truncate font-medium">
          {turnover.unit_name ?? "Unknown"}
        </span>
        <span className="text-gray-500 capitalize shrink-0">
          {turnover.turnover_type ?? "—"}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="tabular-nums text-gray-300 font-semibold">
          {days !== null ? `${days}d` : "—"}
        </span>
        <span className="text-gray-600 text-xs">
          / {threshold}d
        </span>
      </div>
    </div>
  );
}

interface ActiveTurnoversProps {
  tvMode?: boolean;
}

export default function ActiveTurnovers({ tvMode }: ActiveTurnoversProps) {
  const { data, isLoading } = useTurnovers("active", 50);
  const EXCLUDED_STATUSES = ["owner", "listed for sale"];
  const turnovers = (data?.turnovers ?? []).filter(
    (t) =>
      t.key_turnin_date !== null &&
      !EXCLUDED_STATUSES.includes((t.status ?? "").toLowerCase())
  );

  return (
    <div className="space-y-2">
      <h2 className={`font-semibold text-gray-400 uppercase tracking-wider ${tvMode ? "text-xl" : "text-sm"}`}>
        Active Turnovers
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : turnovers.length === 0 ? (
        <p className="text-gray-600 text-sm py-4">No active turnovers</p>
      ) : (
        <div className="space-y-1">
          {turnovers.map((t) => (
            <TurnoverRow key={t.id} turnover={t} tvMode={tvMode} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useTurnovers, type Turnover } from "@/hooks/use-dashboard";

const EXCLUDED_STATUSES = ["owner", "listed for sale"];

function getDaysElapsed(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days < 0 ? null : days;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

function ComingSoonRow({ turnover, tvMode }: { turnover: Turnover; tvMode?: boolean }) {
  const daysUntil = getDaysUntil(turnover.key_turnin_date);
  const dateLabel = formatDate(turnover.key_turnin_date);

  const urgencyColor =
    daysUntil === null ? "text-gray-500" :
    daysUntil <= 0 ? "text-red-400" :
    daysUntil <= 7 ? "text-amber-400" :
    "text-gray-400";

  const urgencyLabel =
    daysUntil === null ? "" :
    daysUntil <= 0 ? "now" :
    `in ${daysUntil}d`;

  return (
    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors ${tvMode ? "text-lg" : "text-sm"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 bg-purple-500 ring-purple-500/30" />
        <span className="text-white truncate font-medium">
          {turnover.unit_name ?? "Unknown"}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-gray-400 text-xs">{dateLabel}</span>
        <span className={`tabular-nums font-semibold ${urgencyColor}`}>
          {urgencyLabel}
        </span>
      </div>
    </div>
  );
}

interface PanelProps {
  tvMode?: boolean;
}

export function useActiveTurnoverData() {
  const { data, isLoading } = useTurnovers("active", 50);
  const allTurnovers = data?.turnovers ?? [];

  const active = allTurnovers
    .filter(
      (t) =>
        t.key_turnin_date !== null &&
        (t.status ?? "").toLowerCase() !== "default" &&
        !EXCLUDED_STATUSES.includes((t.status ?? "").toLowerCase())
    )
    .sort((a, b) => (a.key_turnin_date ?? "").localeCompare(b.key_turnin_date ?? ""));

  const comingSoon = allTurnovers
    .filter((t) => (t.status ?? "").toLowerCase() === "default")
    .sort((a, b) => {
      if (!a.key_turnin_date) return 1;
      if (!b.key_turnin_date) return -1;
      return a.key_turnin_date.localeCompare(b.key_turnin_date);
    });

  return { active, comingSoon, isLoading };
}

export default function ActiveTurnovers({ tvMode }: PanelProps) {
  const { active, isLoading } = useActiveTurnoverData();
  const sectionHeader = tvMode ? "text-xl" : "text-sm";

  return (
    <div className="space-y-2">
      <h2 className={`font-semibold text-gray-400 uppercase tracking-wider ${sectionHeader}`}>
        Active Turnovers
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <p className="text-gray-600 text-sm py-4">No active turnovers</p>
      ) : (
        <div className="space-y-1">
          {active.map((t) => (
            <TurnoverRow key={t.id} turnover={t} tvMode={tvMode} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComingSoon({ tvMode }: PanelProps) {
  const { comingSoon } = useActiveTurnoverData();
  const sectionHeader = tvMode ? "text-xl" : "text-sm";

  if (comingSoon.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className={`font-semibold text-purple-400/70 uppercase tracking-wider ${sectionHeader}`}>
        Coming Soon
      </h2>
      <div className="space-y-1">
        {comingSoon.map((t) => (
          <ComingSoonRow key={t.id} turnover={t} tvMode={tvMode} />
        ))}
      </div>
    </div>
  );
}

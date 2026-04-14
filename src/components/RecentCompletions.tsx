"use client";

import { useTurnovers, type Turnover } from "@/hooks/use-dashboard";

function CompletionRow({ turnover }: { turnover: Turnover }) {
  const earned =
    (turnover.office_incentive_amount ?? 0) > 0 ||
    (turnover.tech_incentive_amount ?? 0) > 0;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03] text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className={earned ? "text-emerald-400" : "text-red-400"}>
          {earned ? "✓" : "✗"}
        </span>
        <span className="text-white truncate">{turnover.unit_name ?? "Unknown"}</span>
        <span className="text-gray-500 capitalize shrink-0">
          {turnover.turnover_type ?? "—"}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {turnover.office_days !== null && (
          <span className="tabular-nums text-gray-400">
            {turnover.office_days}d office
          </span>
        )}
        {turnover.tech_days !== null && (
          <span className="tabular-nums text-gray-400">
            {turnover.tech_days}d tech
          </span>
        )}
      </div>
    </div>
  );
}

export default function RecentCompletions() {
  const { data, isLoading } = useTurnovers("completed", 10);
  const turnovers = data?.turnovers ?? [];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Recent Completions
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : turnovers.length === 0 ? (
        <p className="text-gray-600 text-sm py-4">No completed turnovers yet</p>
      ) : (
        <div className="space-y-1">
          {turnovers.map((t) => (
            <CompletionRow key={t.id} turnover={t} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useLedger, type LedgerEntry } from "@/hooks/use-dashboard";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isPositive = entry.amount > 0;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03] text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            entry.pot === "office"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-amber-500/20 text-amber-400"
          }`}
        >
          {entry.pot === "office" ? "O" : "T"}
        </span>
        <span className="text-gray-300 truncate">{entry.reason}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span
          className={`tabular-nums font-semibold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}${Math.abs(entry.amount).toFixed(0)}
        </span>
        <span className="text-gray-600 text-xs w-28 text-right">
          {formatDate(entry.created_at)}
        </span>
      </div>
    </div>
  );
}

export default function LedgerHistory() {
  const { data, isLoading } = useLedger(undefined, 30);
  const entries = data?.entries ?? [];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Ledger History
      </h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-gray-600 text-sm py-4">No transactions yet</p>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          {entries.map((e) => (
            <LedgerRow key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

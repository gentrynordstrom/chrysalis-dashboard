"use client";

import { useSyncStatus } from "@/hooks/use-dashboard";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function SyncBadge() {
  const { data } = useSyncStatus(60000);
  const sources = data?.sources ?? [];

  const lastSync = sources
    .map((s) => s.last_synced_at)
    .filter(Boolean)
    .sort()
    .pop();

  const hasError = sources.some((s) => s.sync_status === "error");
  const isSyncing = sources.some((s) => s.sync_status === "syncing");

  const dotColor = hasError
    ? "bg-red-400"
    : isSyncing
      ? "bg-amber-400 animate-pulse"
      : "bg-emerald-400";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {isSyncing ? "Syncing..." : `Synced ${timeAgo(lastSync ?? null)}`}
    </span>
  );
}

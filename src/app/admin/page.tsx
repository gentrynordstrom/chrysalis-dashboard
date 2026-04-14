"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ConfigRow {
  id: string;
  pot: string;
  turnover_type: string;
  rule_key: string;
  day_threshold: number;
  amount: number;
}

interface SyncStatus {
  name: string;
  last_synced_at: string | null;
  sync_status: string;
  error_log: string | null;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => {
        if (r.ok) setAuthed(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setPassword("");
    } else {
      setLoginError("Invalid password");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 px-6"
        >
          <h1 className="text-xl font-bold text-center">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            autoFocus
          />
          {loginError && (
            <p className="text-red-400 text-sm text-center">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Sign In
          </button>
          <Link
            href="/"
            className="block text-center text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-10">
        <TransactionSection />
        <LedgerManagement />
        <ConfigSection />
        <SyncSection />
      </main>
    </div>
  );
}

function TransactionSection() {
  const [mode, setMode] = useState<"withdrawal" | "deposit">("withdrawal");
  const [pot, setPot] = useState<"office" | "tech">("office");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const endpoint =
      mode === "withdrawal" ? "/api/admin/withdrawal" : "/api/admin/adjustment";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pot,
        amount: parseFloat(amount),
        reason,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      const label = mode === "withdrawal" ? "Withdrawal" : "Deposit";
      setResult({ success: true, message: `${label} of $${parseFloat(amount).toFixed(2)} recorded` });
      setAmount("");
      setReason("");
    } else {
      setResult({ error: data.error });
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Manual Transaction
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4"
      >
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("withdrawal")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "withdrawal"
                  ? "bg-red-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Withdrawal (spend from pot)
            </button>
            <button
              type="button"
              onClick={() => setMode("deposit")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "deposit"
                  ? "bg-emerald-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Deposit (add to pot)
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Pot</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPot("office")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pot === "office"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Office Pot
              </button>
              <button
                type="button"
                onClick={() => setPot("tech")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pot === "tech"
                    ? "bg-amber-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Tech Pot
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150.00"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={mode === "withdrawal" ? "Team dinner at Lodi Tap House" : "Holiday bonus top-up"}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            {result?.success && (
              <span className="text-emerald-400 text-sm">{result.message}</span>
            )}
            {result?.error && (
              <span className="text-red-400 text-sm">{result.error}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`${
              mode === "withdrawal"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            } disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors`}
          >
            {submitting
              ? "Submitting..."
              : mode === "withdrawal"
              ? "Record Withdrawal"
              : "Record Deposit"}
          </button>
        </div>
      </form>
    </section>
  );
}

interface LedgerRow {
  id: string;
  pot: string;
  amount: number;
  reason: string;
  source_type: string;
  created_at: string;
}

function LedgerManagement() {
  const [entries, setEntries] = useState<LedgerRow[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    const res = await fetch("/api/admin/ledger?limit=100");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoadingLedger(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/admin/ledger", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    setDeletingId(null);
    setConfirmId(null);
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function sourceLabel(type: string): string {
    switch (type) {
      case "turnover": return "Turnover";
      case "review": return "Review";
      case "manual_withdrawal": return "Withdrawal";
      case "adjustment": return "Adjustment";
      default: return type;
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Ledger Entries
      </h2>
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
        {loadingLedger ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 bg-white/5 animate-pulse rounded" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-600 text-sm py-4">No ledger entries</p>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-sm group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      e.pot === "office"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {e.pot === "office" ? "O" : "T"}
                  </span>
                  <span className="text-gray-300 truncate">{e.reason}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-gray-600 text-xs">
                    {sourceLabel(e.source_type)}
                  </span>
                  <span
                    className={`tabular-nums font-semibold w-16 text-right ${
                      e.amount > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {e.amount > 0 ? "+" : ""}${Math.abs(e.amount).toFixed(0)}
                  </span>
                  <span className="text-gray-600 text-xs w-28 text-right">
                    {formatDate(e.created_at)}
                  </span>
                  {confirmId === e.id ? (
                    <div className="flex items-center gap-1 w-20 justify-end">
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-red-400 hover:text-red-300 text-xs px-1.5 py-0.5 font-medium"
                      >
                        {deletingId === e.id ? "..." : "Yes"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-gray-500 hover:text-gray-300 text-xs px-1.5 py-0.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(e.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors text-xs w-20 text-right opacity-0 group-hover:opacity-100"
                      title="Delete entry"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ConfigSection() {
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config ?? []);
    }
    setLoadingConfig(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  function startEditing(row: ConfigRow) {
    setEditingId(row.id);
    setEditThreshold(String(row.day_threshold));
    setEditAmount(String(row.amount));
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        day_threshold: parseInt(editThreshold),
        amount: parseFloat(editAmount),
      }),
    });

    if (res.ok) {
      setEditingId(null);
      loadConfig();
    }
    setSaving(false);
  }

  function formatRuleKey(key: string): string {
    return key === "base" ? "Base" : key === "kicker" ? "20% Kicker" : key;
  }

  const officeCfg = config.filter((c) => c.pot === "office");
  const techCfg = config.filter((c) => c.pot === "tech");

  function renderTable(title: string, rows: ConfigRow[], color: string) {
    return (
      <div>
        <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${color}`}>
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Rule</th>
                <th className="pb-2 pr-4 font-medium text-right">Threshold (days)</th>
                <th className="pb-2 pr-4 font-medium text-right">Amount ($)</th>
                <th className="pb-2 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 pr-4 capitalize text-gray-300">
                    {row.turnover_type}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">
                    {formatRuleKey(row.rule_key)}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    {editingId === row.id ? (
                      <input
                        type="number"
                        value={editThreshold}
                        onChange={(e) => setEditThreshold(e.target.value)}
                        className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-right text-sm"
                      />
                    ) : (
                      <span className="text-gray-200 tabular-nums">
                        {row.day_threshold}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    {editingId === row.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-right text-sm"
                      />
                    ) : (
                      <span className="text-gray-200 tabular-nums">
                        ${Number(row.amount).toFixed(0)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    {editingId === row.id ? (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => saveEdit(row.id)}
                          disabled={saving}
                          className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(row)}
                        className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Incentive Rules Configuration
      </h2>
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-6">
        {loadingConfig ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-white/5 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            {renderTable("Office Pot", officeCfg, "text-blue-400")}
            {renderTable("Tech Pot", techCfg, "text-amber-400")}
          </>
        )}
      </div>
    </section>
  );
}

function SyncSection() {
  const [status, setStatus] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/dashboard/status");
    if (res.ok) {
      const data = await res.json();
      setStatus(data.sources ?? []);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  async function triggerSync(board?: string) {
    setSyncing(true);
    setSyncResult(null);

    const url = board ? `/api/sync?board=${board}` : "/api/sync";
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();

    setSyncing(false);
    if (res.ok) {
      const parts = [];
      if (data.turnoversProcessed) parts.push(`${data.turnoversProcessed} turnovers`);
      if (data.workOrdersProcessed) parts.push(`${data.workOrdersProcessed} work orders`);
      if (data.rulesResult?.totalNewEntries) parts.push(`${data.rulesResult.totalNewEntries} new ledger entries`);
      setSyncResult(parts.length ? `Synced: ${parts.join(", ")}` : "Sync complete — no changes");
      loadStatus();
    } else {
      setSyncResult(`Error: ${data.error}`);
    }
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function statusDot(s: string): string {
    if (s === "ok") return "bg-emerald-500";
    if (s === "syncing") return "bg-amber-500 animate-pulse";
    return "bg-red-500";
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Sync Controls
      </h2>
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-5">
        <div className="space-y-2">
          {status.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot(s.sync_status)}`} />
                <span className="text-gray-300 text-sm capitalize">
                  {s.name.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {formatTime(s.last_synced_at)}
              </span>
            </div>
          ))}
          {status.some((s) => s.error_log) && (
            <div className="mt-2 text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              {status
                .filter((s) => s.error_log)
                .map((s) => (
                  <div key={s.name}>
                    <strong className="capitalize">{s.name.replace(/_/g, " ")}:</strong>{" "}
                    {s.error_log}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => triggerSync()}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {syncing ? "Syncing..." : "Full Sync"}
          </button>
          <button
            onClick={() => triggerSync("turnovers")}
            disabled={syncing}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors border border-white/10"
          >
            Sync Turnovers Only
          </button>
          <button
            onClick={() => triggerSync("work_orders")}
            disabled={syncing}
            className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors border border-white/10"
          >
            Sync Work Orders Only
          </button>
        </div>

        {syncResult && (
          <p
            className={`text-sm ${
              syncResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {syncResult}
          </p>
        )}
      </div>
    </section>
  );
}

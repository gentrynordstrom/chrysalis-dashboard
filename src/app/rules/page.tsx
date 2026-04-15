"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ConfigRow {
  id: string;
  pot: string;
  turnover_type: string;
  rule_key: string;
  day_threshold: number;
  amount: number;
}

export default function RulesPage() {
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => setConfig(data.config ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const officeBase = config
    .filter((c) => c.pot === "office" && c.rule_key === "base")
    .sort((a, b) => a.day_threshold - b.day_threshold);

  const techBase = config
    .filter((c) => c.pot === "tech" && c.rule_key === "base")
    .sort((a, b) => a.day_threshold - b.day_threshold);

  const techKicker = config
    .filter((c) => c.pot === "tech" && c.rule_key === "kicker")
    .sort((a, b) => a.day_threshold - b.day_threshold);

  const techRows = techBase.map((base) => {
    const kicker = techKicker.find((k) => k.turnover_type === base.turnover_type);
    return { ...base, kickerAmount: kicker?.amount ?? 0 };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">How Incentives Work</h1>
      </header>

      <main className="px-6 py-10 max-w-4xl mx-auto space-y-14">
        {/* Lifecycle */}
        <section>
          <h2 className="text-lg font-semibold text-gray-200 mb-6">
            The Turnover Lifecycle
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Step
              number={1}
              label="Keys Received"
              detail="Clock starts ticking"
              color="blue"
            />
            <Arrow />
            <Step
              number={2}
              label="Work Completed"
              detail="Tech team finishes the unit"
              color="amber"
            />
            <Arrow />
            <Step
              number={3}
              label="Deposit & Billing"
              detail="Deposit received, unit billed"
              color="emerald"
            />
            <Arrow />
            <Step
              number={4}
              label="Bonus Earned"
              detail="Added to the pot automatically"
              color="purple"
            />
          </div>
        </section>

        {/* Office Pot */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
              O
            </span>
            <h2 className="text-lg font-semibold text-gray-200">Office Pot</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5 ml-11">
            When a turnover is completed within the day threshold, the deposit
            is received, and the unit is billed, the office pot earns a bonus.
            The faster the turnaround, the more it matters — beat the clock and
            the whole office benefits.
          </p>
          {loading ? (
            <LoadingRows />
          ) : (
            <RulesTable
              headers={["Turnover Type", "Must Complete Within", "Bonus"]}
              rows={officeBase.map((r) => [
                capitalize(r.turnover_type),
                `${r.day_threshold} days`,
                `$${Number(r.amount).toFixed(0)}`,
              ])}
              accentColor="blue"
            />
          )}
        </section>

        {/* Tech Pot — Turnovers */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
              T
            </span>
            <h2 className="text-lg font-semibold text-gray-200">Tech Pot — Turnovers</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5 ml-11">
            When the tech team completes work on a turnover within the day
            threshold, the tech pot earns a bonus. If actual hours come in at
            or under the original estimate, an extra kicker is added on top.
          </p>
          {loading ? (
            <LoadingRows />
          ) : (
            <RulesTable
              headers={["Turnover Type", "Must Complete Within", "Base Bonus", "Under-Budget Kicker"]}
              rows={techRows.map((r) => [
                capitalize(r.turnover_type),
                `${r.day_threshold} days`,
                `$${Number(r.amount).toFixed(0)}`,
                r.kickerAmount > 0 ? `+$${Number(r.kickerAmount).toFixed(0)}` : "—",
              ])}
              accentColor="amber"
            />
          )}
        </section>

        {/* Tech Pot — Reviews */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
              T
            </span>
            <h2 className="text-lg font-semibold text-gray-200">Tech Pot — 5-Star Reviews</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5 ml-11">
            Every work order that receives a perfect 5-star rating in both the
            tech category and the quality category earns the tech pot a bonus.
            Great work gets noticed — and rewarded.
          </p>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 ml-11 flex items-center gap-5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div>
              <span className="text-2xl font-bold text-emerald-400">+$5</span>
              <span className="text-gray-500 text-sm ml-2">per qualifying review</span>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-300 mb-3">How Payouts Work</h2>
          <ul className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">+</span>
              <span>Bonuses are deposited into the pot automatically every 5 minutes as turnovers and reviews qualify.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">−</span>
              <span>When the team spends from a pot (team dinners, events, etc.), a withdrawal is recorded and the balance updates.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">i</span>
              <span>The jar on the dashboard always shows the current balance — deposits minus withdrawals.</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Step({
  number,
  label,
  detail,
  color,
}: {
  number: number;
  label: string;
  detail: string;
  color: string;
}) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-500/15", text: "text-blue-400", ring: "ring-blue-500/30" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-400", ring: "ring-amber-500/30" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/30" },
    purple: { bg: "bg-purple-500/15", text: "text-purple-400", ring: "ring-purple-500/30" },
  };
  const c = colors[color] ?? colors.blue;

  return (
    <div className={`flex-1 rounded-xl ${c.bg} ring-1 ${c.ring} p-4 text-center`}>
      <div className={`text-2xl font-bold ${c.text} mb-1`}>{number}</div>
      <div className="text-white text-sm font-medium">{label}</div>
      <div className="text-gray-500 text-xs mt-0.5">{detail}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden sm:flex items-center justify-center text-gray-600 shrink-0">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function RulesTable({
  headers,
  rows,
  accentColor,
}: {
  headers: string[];
  rows: string[][];
  accentColor: string;
}) {
  const headerColor =
    accentColor === "blue" ? "text-blue-400/70" : "text-amber-400/70";

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden ml-11">
      <table className="w-full text-sm">
        <thead>
          <tr className={`${headerColor} text-left`}>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`py-3 px-5 font-medium ${i > 0 ? "text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-white/5">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-3 px-5 ${ci > 0 ? "text-right" : ""} ${
                    ci === 0
                      ? "text-gray-200 font-medium capitalize"
                      : ci === row.length - 1
                      ? "text-emerald-400 font-semibold tabular-nums"
                      : "text-gray-400 tabular-nums"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 ml-11">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

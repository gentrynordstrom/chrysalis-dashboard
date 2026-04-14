"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  useBalances,
  useNewEntries,
  useLedger,
  markEntriesDisplayed,
  type LedgerEntry,
} from "@/hooks/use-dashboard";
import { useTvMode } from "@/hooks/use-tv-mode";
import { useAudio } from "@/hooks/use-audio";
import Jar from "./Jar";
import ActiveTurnovers from "./ActiveTurnovers";
import RecentCompletions from "./RecentCompletions";
import LedgerHistory from "./LedgerHistory";
import Toasts from "./Toast";
import SyncBadge from "./SyncBadge";

interface ToastItem {
  id: string;
  pot: "office" | "tech";
  amount: number;
  reason: string;
}

export default function Dashboard() {
  const { tvMode, setTvMode, dimmed, resetActivity } = useTvMode();
  const { playSound, muted, setMuted } = useAudio();

  const refreshRate = tvMode ? 15000 : 30000;
  const { data: balances } = useBalances(refreshRate);
  const { data: newEntriesData, mutate: refreshNewEntries } = useNewEntries(
    tvMode ? 5000 : 10000
  );
  const { data: ledgerData } = useLedger(undefined, 1);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [animatingPot, setAnimatingPot] = useState<"office" | "tech" | null>(null);
  const processedIds = useRef(new Set<string>());

  const lastOfficeDeposit = ledgerData?.entries?.find(
    (e: LedgerEntry) => e.pot === "office" && e.amount > 0
  );
  const lastTechDeposit = ledgerData?.entries?.find(
    (e: LedgerEntry) => e.pot === "tech" && e.amount > 0
  );

  // Process new entries: show toasts, play sound, animate jars
  const processNewEntries = useCallback(
    async (entries: LedgerEntry[]) => {
      const unprocessed = entries.filter(
        (e) => !processedIds.current.has(e.id)
      );
      if (unprocessed.length === 0) return;

      const newToasts: ToastItem[] = [];
      const pots = new Set<"office" | "tech">();

      for (const entry of unprocessed) {
        processedIds.current.add(entry.id);
        if (entry.amount > 0) {
          newToasts.push({
            id: entry.id,
            pot: entry.pot,
            amount: entry.amount,
            reason: entry.reason,
          });
          pots.add(entry.pot);
        }
      }

      if (newToasts.length > 0) {
        setToasts((prev) => [...prev, ...newToasts]);
        resetActivity();

        for (const pot of pots) {
          setAnimatingPot(pot);
          await playSound();
          await new Promise((r) => setTimeout(r, 400));
        }

        setTimeout(() => setAnimatingPot(null), 2000);
      }

      await markEntriesDisplayed(unprocessed.map((e) => e.id));
      refreshNewEntries();
    },
    [playSound, resetActivity, refreshNewEntries]
  );

  useEffect(() => {
    const entries = newEntriesData?.entries;
    if (entries?.length) {
      processNewEntries(entries);
    }
  }, [newEntriesData, processNewEntries]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div
      className={`min-h-screen bg-gray-950 text-white transition-opacity duration-1000 ${
        dimmed ? "opacity-20" : "opacity-100"
      }`}
      onClick={resetActivity}
    >
      <Toasts items={toasts} onDismiss={dismissToast} />

      {/* Header */}
      {!tvMode && (
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Chrysalis Incentive Dashboard
            </h1>
            <SyncBadge />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted(!muted)}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm px-2 py-1 rounded"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => setTvMode(true)}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              TV Mode
            </button>
          </div>
        </header>
      )}

      {/* TV Mode Header */}
      {tvMode && (
        <header className="flex items-center justify-between px-8 py-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Chrysalis Incentive Dashboard
          </h1>
          <button
            onClick={() => setTvMode(false)}
            className="text-gray-600 hover:text-gray-400 text-sm"
          >
            Exit TV
          </button>
        </header>
      )}

      <main className={tvMode ? "px-8 py-6" : "px-6 py-8"}>
        {/* Jars */}
        <div
          className={`flex items-start justify-center ${
            tvMode ? "gap-24 py-12" : "gap-16 py-8"
          }`}
        >
          <Jar
            label="Office Pot"
            balance={balances?.office ?? 0}
            lastDeposit={
              lastOfficeDeposit
                ? {
                    amount: lastOfficeDeposit.amount,
                    reason: lastOfficeDeposit.reason,
                  }
                : null
            }
            accentColor="#3b82f6"
            glowColor="#3b82f6"
            tvMode={tvMode}
            animating={animatingPot === "office"}
          />
          <Jar
            label="Tech Pot"
            balance={balances?.tech ?? 0}
            lastDeposit={
              lastTechDeposit
                ? {
                    amount: lastTechDeposit.amount,
                    reason: lastTechDeposit.reason,
                  }
                : null
            }
            accentColor="#f59e0b"
            glowColor="#f59e0b"
            tvMode={tvMode}
            animating={animatingPot === "tech"}
          />
        </div>

        {/* Panels */}
        <div
          className={
            tvMode
              ? "mt-8 max-w-4xl mx-auto"
              : "mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          }
        >
          <div className="lg:col-span-1">
            <ActiveTurnovers tvMode={tvMode} />
          </div>

          {!tvMode && (
            <>
              <div className="lg:col-span-1">
                <RecentCompletions />
              </div>
              <div className="lg:col-span-1">
                <LedgerHistory />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

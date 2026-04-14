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
import Link from "next/link";
import Jar from "./Jar";
import ActiveTurnovers, { ComingSoon } from "./ActiveTurnovers";
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
  const { playSound, muted, setMuted, ready: audioReady, ensureReady } = useAudio();

  const refreshRate = tvMode ? 15000 : 30000;
  const { data: balances } = useBalances(refreshRate);
  const { data: newEntriesData, mutate: refreshNewEntries } = useNewEntries(
    tvMode ? 5000 : 10000
  );
  const { data: ledgerData } = useLedger(undefined, 1);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [animatingPot, setAnimatingPot] = useState<"office" | "tech" | null>(null);
  const processedIds = useRef(new Set<string>());
  const pendingEntries = useRef<LedgerEntry[]>([]);
  const [hasPending, setHasPending] = useState(false);

  const lastOfficeDeposit = ledgerData?.entries?.find(
    (e: LedgerEntry) => e.pot === "office" && e.amount > 0
  );
  const lastTechDeposit = ledgerData?.entries?.find(
    (e: LedgerEntry) => e.pot === "tech" && e.amount > 0
  );

  const fireEntries = useCallback(
    async (entries: LedgerEntry[]) => {
      const newToasts: ToastItem[] = [];
      const pots = new Set<"office" | "tech">();

      for (const entry of entries) {
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

      await markEntriesDisplayed(entries.map((e) => e.id));
      refreshNewEntries();
    },
    [playSound, resetActivity, refreshNewEntries]
  );

  // When new entries arrive, either fire immediately or queue them
  const processNewEntries = useCallback(
    async (entries: LedgerEntry[]) => {
      const unprocessed = entries.filter(
        (e) => !processedIds.current.has(e.id)
      );
      if (unprocessed.length === 0) return;

      if (audioReady || muted) {
        pendingEntries.current = [];
        setHasPending(false);
        await fireEntries(unprocessed);
      } else {
        pendingEntries.current = unprocessed;
        setHasPending(true);
      }
    },
    [audioReady, muted, fireEntries]
  );

  useEffect(() => {
    const entries = newEntriesData?.entries;
    if (entries?.length) {
      processNewEntries(entries);
    }
  }, [newEntriesData, processNewEntries]);

  // When audio becomes ready, flush any queued entries
  useEffect(() => {
    if ((audioReady || muted) && pendingEntries.current.length > 0) {
      const pending = [...pendingEntries.current];
      pendingEntries.current = [];
      setHasPending(false);
      fireEntries(pending);
    }
  }, [audioReady, muted, fireEntries]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRootClick = useCallback(() => {
    resetActivity();
    ensureReady();
  }, [resetActivity, ensureReady]);

  return (
    <div
      className={`min-h-screen bg-gray-950 text-white transition-opacity duration-1000 ${
        dimmed ? "opacity-20" : "opacity-100"
      }`}
      onClick={handleRootClick}
    >
      <Toasts items={toasts} onDismiss={dismissToast} />

      {/* Sound enable banner */}
      {!audioReady && !muted && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-amber-400 text-sm cursor-pointer hover:bg-amber-500/15 transition-colors">
          {hasPending ? "🔔 New deposit! Click anywhere to enable sound" : "Click anywhere to enable sound notifications"}
        </div>
      )}

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
            <Link
              href="/admin"
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded"
              title="Admin"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
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
              : "mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[90rem] mx-auto"
          }
        >
          <div>
            <ActiveTurnovers tvMode={tvMode} />
          </div>

          {!tvMode && (
            <>
              <div>
                <ComingSoon tvMode={tvMode} />
              </div>
              <div>
                <RecentCompletions />
              </div>
              <div>
                <LedgerHistory />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

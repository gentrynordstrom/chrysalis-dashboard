"use client";

import { useEffect, useRef, useState } from "react";

interface JarProps {
  label: string;
  balance: number;
  lastDeposit?: { amount: number; reason: string } | null;
  accentColor: string;
  glowColor: string;
  tvMode?: boolean;
  animating?: boolean;
}

function computeFillPercent(balance: number): number {
  if (balance <= 0) return 0;

  // $500 steps up to $2,000, then $1,000 steps
  let threshold: number;
  if (balance <= 2000) {
    threshold = Math.ceil(balance / 500) * 500;
  } else {
    threshold = Math.ceil(balance / 1000) * 1000;
  }

  const prevThreshold = threshold <= 500 ? 0 :
    threshold <= 2000 ? threshold - 500 :
    threshold - 1000;

  const range = threshold - prevThreshold;
  const progress = balance - prevThreshold;
  return Math.min((progress / range) * 100, 100);
}

export default function Jar({
  label,
  balance,
  lastDeposit,
  accentColor,
  glowColor,
  tvMode,
  animating,
}: JarProps) {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [fillPct, setFillPct] = useState(computeFillPercent(balance));
  const prevBalance = useRef(balance);

  useEffect(() => {
    const target = balance;
    const start = prevBalance.current;
    prevBalance.current = target;

    if (start === target) {
      setDisplayBalance(target);
      setFillPct(computeFillPercent(target));
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = start + (target - start) * eased;
      setDisplayBalance(Math.round(current * 100) / 100);
      setFillPct(computeFillPercent(current));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [balance]);

  const textSize = tvMode ? "text-6xl" : "text-4xl";
  const labelSize = tvMode ? "text-2xl" : "text-lg";

  return (
    <div className={`flex flex-col items-center gap-4 ${animating ? "animate-pulse" : ""}`}>
      <p className={`${labelSize} font-semibold tracking-wide text-gray-300 uppercase`}>
        {label}
      </p>

      {/* Jar container */}
      <div className="relative w-44 h-64 mx-auto">
        {/* Jar body */}
        <div
          className="absolute inset-0 rounded-b-3xl rounded-t-lg border-2 overflow-hidden"
          style={{
            borderColor: accentColor,
            boxShadow: animating ? `0 0 30px ${glowColor}` : `0 0 10px ${glowColor}33`,
          }}
        >
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${fillPct}%`,
              background: `linear-gradient(to top, ${accentColor}cc, ${accentColor}66)`,
            }}
          >
            {/* Liquid shimmer */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.1) 8px,
                  rgba(255,255,255,0.1) 16px
                )`,
              }}
            />
          </div>

          {/* Glass highlight */}
          <div className="absolute inset-y-0 left-2 w-4 bg-gradient-to-r from-white/10 to-transparent rounded-full" />
        </div>

        {/* Jar lid */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 rounded-t-lg border-2 border-b-0"
          style={{
            borderColor: accentColor,
            backgroundColor: `${accentColor}22`,
          }}
        />
      </div>

      {/* Balance */}
      <p className={`${textSize} font-bold tabular-nums`} style={{ color: accentColor }}>
        ${displayBalance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>

      {/* Last deposit */}
      {lastDeposit && (
        <div
          className="text-center max-w-xs px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}
        >
          +${lastDeposit.amount} — {lastDeposit.reason}
        </div>
      )}
    </div>
  );
}

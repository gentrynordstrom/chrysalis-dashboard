"use client";

import { useState, useRef, useCallback, useEffect } from "react";

function playCoinSound(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  // Two-tone "coin" chime: C6 then E6
  const freqs = [1047, 1319];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    osc.start(now + i * 0.12);
    osc.stop(now + 0.5 + i * 0.12);
  });

  // Soft shimmer overtone
  const shimmer = ctx.createOscillator();
  shimmer.type = "triangle";
  shimmer.frequency.setValueAtTime(2637, now);
  const shimmerGain = ctx.createGain();
  shimmerGain.connect(ctx.destination);
  shimmerGain.gain.setValueAtTime(volume * 0.08, now + 0.08);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  shimmer.connect(shimmerGain);
  shimmer.start(now + 0.08);
  shimmer.stop(now + 0.4);
}

export function useAudio() {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  // Resume audio context on any user interaction
  useEffect(() => {
    const resume = () => {
      const ctx = audioCtxRef.current;
      if (ctx?.state === "suspended") {
        ctx.resume();
      }
    };
    window.addEventListener("click", resume);
    window.addEventListener("keydown", resume);
    window.addEventListener("touchstart", resume);
    return () => {
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("touchstart", resume);
    };
  }, []);

  const playSound = useCallback(async () => {
    if (muted) return;

    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      playCoinSound(ctx, volume);
    } catch {
      // Silently fail if audio isn't available
    }
  }, [muted, volume]);

  return { muted, setMuted, volume, setVolume, playSound, unlocked: true };
}

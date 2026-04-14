"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [ready, setReady] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const ensureReady = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (!audioBufferRef.current && ctx.state === "running") {
      try {
        const response = await fetch("/sounds/coin.mp3");
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        // Will retry on next call
      }
    }

    if (ctx.state === "running") {
      setReady(true);
    }
    return ctx.state === "running";
  }, []);

  useEffect(() => {
    const handler = () => { ensureReady(); };
    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("touchstart", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [ensureReady]);

  const playSound = useCallback(async (): Promise<boolean> => {
    if (muted) return true;

    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      if (ctx.state !== "running") {
        return false;
      }

      if (!audioBufferRef.current) {
        const response = await fetch("/sounds/coin.mp3");
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      source.buffer = audioBufferRef.current;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);

      setReady(true);
      return true;
    } catch {
      return false;
    }
  }, [muted, volume]);

  return { muted, setMuted, volume, setVolume, playSound, ready, ensureReady };
}

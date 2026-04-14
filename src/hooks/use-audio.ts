"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useAudio() {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [unlocked, setUnlocked] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setUnlocked(true);
  }, []);

  useEffect(() => {
    const handler = () => unlock();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [unlock]);

  const playSound = useCallback(
    async (url = "/sounds/coin.mp3") => {
      if (muted || !unlocked) return;

      try {
        const ctx = audioCtxRef.current ?? new AudioContext();
        audioCtxRef.current = ctx;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
      } catch {
        // Fallback to HTML Audio
        const audio = new Audio(url);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    },
    [muted, volume, unlocked]
  );

  return { muted, setMuted, volume, setVolume, playSound, unlocked };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export function useTvMode() {
  const [tvMode, setTvMode] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setDimmed(false);
  }, []);

  useEffect(() => {
    if (!tvMode) {
      setDimmed(false);
      return;
    }

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 10 * 60 * 1000) {
        setDimmed(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tvMode, lastActivity]);

  return { tvMode, setTvMode, dimmed, setDimmed, resetActivity };
}

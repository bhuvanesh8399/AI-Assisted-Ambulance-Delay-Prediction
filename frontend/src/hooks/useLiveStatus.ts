import { useEffect, useMemo, useState } from "react";

export type LiveState = "LIVE" | "STALE" | "OFFLINE";

type UseLiveStatusParams = {
  lastUpdatedAt?: string | number | Date | null;
  staleAfterMs?: number;
  offlineAfterMs?: number;
  tickMs?: number;
};

export function useLiveStatus({
  lastUpdatedAt,
  staleAfterMs = 8000,
  offlineAfterMs = 20000,
  tickMs = 1000,
}: UseLiveStatusParams) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());

    if (!lastUpdatedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [lastUpdatedAt, tickMs]);

  return useMemo(() => {
    if (!lastUpdatedAt) {
      return { liveState: "OFFLINE" as LiveState, ageMs: null };
    }

    const ts = new Date(lastUpdatedAt).getTime();
    if (Number.isNaN(ts)) {
      return { liveState: "OFFLINE" as LiveState, ageMs: null };
    }

    const ageMs = Math.max(0, now - ts);

    if (ageMs <= staleAfterMs) {
      return { liveState: "LIVE" as LiveState, ageMs };
    }

    if (ageMs <= offlineAfterMs) {
      return { liveState: "STALE" as LiveState, ageMs };
    }

    return { liveState: "OFFLINE" as LiveState, ageMs };
  }, [lastUpdatedAt, now, staleAfterMs, offlineAfterMs]);
}

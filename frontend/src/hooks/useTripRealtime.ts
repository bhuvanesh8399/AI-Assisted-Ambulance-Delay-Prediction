import { useEffect, useMemo, useRef, useState } from "react";
import { connectTripWebSocket } from "../services/tripStream";
import type { TripSnapshot, TripStreamMode } from "../services/tripStream";

// Reuse your existing polling fetch.
// Replace with your existing API call.
async function fetchSnapshot(tripId: string): Promise<TripSnapshot> {
  const res = await fetch(`/api/trip/${tripId}/snapshot`);
  if (!res.ok) throw new Error(`snapshot fetch failed: ${res.status}`);
  return await res.json();
}

export function useTripRealtime(tripId: string) {
  const [mode, setMode] = useState<TripStreamMode>("polling"); // NON-NEGOTIABLE: default polling
  const [snapshot, setSnapshot] = useState<TripSnapshot | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const cleanupRef = useRef<null | (() => void)>(null);

  // Polling loop (always available, used by default and as fallback)
  useEffect(() => {
    if (mode !== "polling") return;

    let alive = true;
    setIsStale(false);

    const tick = async () => {
      try {
        const snap = await fetchSnapshot(tripId);
        if (!alive) return;
        setSnapshot(snap);
        setIsStale(false);
      } catch {
        if (!alive) return;
        setIsStale(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 2500); // 2–3s as per spec

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [tripId, mode]);

  // WebSocket mode (experimental)
  useEffect(() => {
    if (mode !== "ws") return;

    setIsStale(false);

    // clean any previous connection
    if (cleanupRef.current) cleanupRef.current();

    cleanupRef.current = connectTripWebSocket(tripId, {
      onMessage: (snap) => {
        setSnapshot(snap);
        setIsStale(false);
      },
      onError: () => {
        // Failure policy: WS failure -> fallback to polling + show stale
        setIsStale(true);
        setMode("polling");
      },
      onClose: () => {
        // Close policy: fallback to polling + show stale
        setIsStale(true);
        setMode("polling");
      },
    });

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
    };
  }, [tripId, mode]);

  const canUseWs = useMemo(() => true, []);

  return {
    snapshot,
    mode,
    setMode,
    canUseWs,
    isStale,
  };
}

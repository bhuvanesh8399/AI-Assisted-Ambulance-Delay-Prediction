// src/hooks/usePolling.ts
import { useEffect, useRef } from "react";

type PollFn = (ctx: { signal: AbortSignal }) => Promise<void> | void;

export function usePolling(opts: {
  enabled: boolean;
  intervalMs: number;
  poll: PollFn;
}) {
  const { enabled, intervalMs, poll } = opts;

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    const start = async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const runOnce = async () => {
        if (stopped) return;
        try {
          await poll({ signal: abortRef.current!.signal });
        } catch {
          // Poll caller handles UI errors; we stay silent here.
        }
      };

      // run immediately, then interval
      await runOnce();

      timerRef.current = window.setInterval(() => {
        runOnce();
      }, intervalMs);
    };

    start();

    return () => {
      stopped = true;
      abortRef.current?.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, intervalMs, poll]);
}

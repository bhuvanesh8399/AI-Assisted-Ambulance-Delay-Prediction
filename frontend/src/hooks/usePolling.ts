import { useEffect } from "react";

export function usePolling(fn: () => void | Promise<void>, intervalMs: number, deps: any[] = []) {
  useEffect(() => {
    let alive = true;

    const tick = async () => {
      if (!alive) return;
      await fn();
    };

    tick();
    const id = setInterval(tick, intervalMs);

    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

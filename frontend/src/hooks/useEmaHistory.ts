import { useEffect, useRef, useState } from "react";

export function useEmaHistory(value: number | null | undefined, maxPoints = 8) {
  const [history, setHistory] = useState<number[]>([]);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (typeof value !== "number") return;
    if (last.current === value) return;
    last.current = value;

    setHistory((prev) => {
      const next = [...prev, value];
      if (next.length > maxPoints) next.shift();
      return next;
    });
  }, [value, maxPoints]);

  return history;
}

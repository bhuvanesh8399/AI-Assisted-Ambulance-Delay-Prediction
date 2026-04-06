import { useEffect, useState } from "react";
import { fetchTripSnapshot, type TripSnapshot } from "../services/tripLiveService";

interface UseTripLiveResult {
  data: TripSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTripLive(tripId: string | null, pollMs = 3000): UseTripLiveResult {
  const [data, setData] = useState<TripSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const next = await fetchTripSnapshot(tripId);
      setData(next);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: number | null = null;
    setLoading(true);
    void refresh();
    if (tripId) {
      timer = window.setInterval(() => {
        void refresh();
      }, pollMs);
    }
    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, [tripId, pollMs]);

  return { data, loading, error, refresh };
}

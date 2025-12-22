import { useEffect, useState } from "react";
import AppShell from "../../../components/layout/AppShell";
import { fetchTrafficDashboard } from "../../../services/dashboard/dashboardService";
import type { TrafficDashboardResponse } from "../../../services/dashboard/types";
import { connectTripWS } from "../../../services/realtime";
import type { RealtimeMode } from "../../../services/realtime";

const pill = (p: string) => {
  if (p === "high") return "bg-red-600 text-white";
  if (p === "medium") return "bg-yellow-400 text-black";
  return "bg-green-600 text-white";
};

export default function TrafficDashboardPage() {
  const [tripId, setTripId] = useState("demo-trip");
  const [data, setData] = useState<TrafficDashboardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [mode, setMode] = useState<RealtimeMode>("polling");
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const fetchPolling = async () => {
    try {
      setErr(null);
      const res = await fetchTrafficDashboard(tripId);
      setData(res);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    }
  };

  useEffect(() => {
    if (!tripId || mode !== "polling") return;
    fetchPolling();
    const t = window.setInterval(fetchPolling, 2500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, mode]);

  useEffect(() => {
    if (!tripId || mode !== "ws") return;
    const cleanup = connectTripWS(
      tripId,
      (msg) => {
        if (msg?.type === "traffic_dashboard") {
          setData(msg.data);
          setLastUpdated(Date.now());
        }
      },
      () => setMode("polling")
    );
    return cleanup;
  }, [tripId, mode]);

  const junctions = (data?.junctions ?? []).slice().sort(
    (a, b) => new Date(a.window_start).getTime() - new Date(b.window_start).getTime()
  );
  const filtered = onlyHigh ? junctions.filter((j) => j.priority === "high") : junctions;
  const now = Date.now();
  const next = filtered.find((j) => new Date(j.window_end).getTime() > now) || null;
  const nextInSec = next ? Math.max(0, Math.floor((new Date(next.window_start).getTime() - now) / 1000)) : null;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Traffic Control Dashboard</h1>
            <p className="text-sm text-zinc-400">Junction windows + risk</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-glow">
            <div className="text-[11px] text-zinc-400">Trip ID</div>
            <input
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="bg-transparent outline-none text-sm w-48 text-white placeholder:text-zinc-500"
              placeholder="demo-trip"
            />
          </div>

          <button
            onClick={() => setOnlyHigh((v) => !v)}
            className={[
              "rounded-xl border px-3 py-2 text-xs font-semibold transition",
              onlyHigh
                ? "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100"
                : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
            ].join(" ")}
          >
            {onlyHigh ? "Showing: HIGH only" : "Filter: HIGH only"}
          </button>

          <button
            onClick={() => {
              const text = filtered.length
                ? filtered
                    .map(
                      (j) =>
                        `${j.priority.toUpperCase()} | ${j.name} | ${new Date(j.window_start).toLocaleTimeString()}–${new Date(j.window_end).toLocaleTimeString()}`
                    )
                    .join("\n")
                : "No corridor plan";
              navigator.clipboard.writeText(text);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition"
          >
            Copy Corridor
          </button>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Auto refresh: 2.5s</span>
            <span>Realtime:</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RealtimeMode)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-zinc-200"
            >
              <option value="polling">Polling</option>
              <option value="ws">WebSocket</option>
            </select>
            {lastUpdated ? (
              <span className="text-[11px] text-zinc-500">
                Age: {Math.floor((Date.now() - lastUpdated) / 1000)}s
              </span>
            ) : null}
          </div>
        </div>

        {err && <div className="p-3 rounded-lg bg-red-500/10 text-red-200 border border-red-500/30">{err}</div>}

        {next && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-400">Next Junction Window</div>
                <div className="mt-2 text-xl font-semibold">{next.name}</div>
                <div className="mt-1 text-sm text-zinc-400">
                  {new Date(next.window_start).toLocaleTimeString()} – {new Date(next.window_end).toLocaleTimeString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Starts in</div>
                <div className="text-2xl font-bold">
                  {nextInSec !== null ? `${Math.floor(nextInSec / 60)}m ${nextInSec % 60}s` : "—"}
                </div>
                <div
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${pill(next.priority)}`}
                >
                  {next.priority.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-glow">
          <div className="text-sm text-zinc-400 mb-3">Critical Junctions (sorted by window)</div>

          {!filtered.length && (
            <div className="text-zinc-400">
              No corridor plan received yet. Possible reasons:
              <ul className="list-disc ml-5 mt-2 text-zinc-500">
                <li>Corridor planner service not wired to DB yet</li>
                <li>Trip has no route geometry</li>
                <li>Prediction exists but planner output not saved</li>
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((j, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border border-white/10 rounded-lg p-3 bg-white/5"
              >
                <div>
                  <div className="font-medium">{j.name}</div>
                  <div className="text-xs text-zinc-500">
                    Window: {new Date(j.window_start).toLocaleTimeString()} – {new Date(j.window_end).toLocaleTimeString()}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded ${pill(j.priority)}`}>{j.priority.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import { useState } from "react";
import AppShell from "../../../components/layout/AppShell";
import LivePill from "../../../components/ui/LivePill";
import { usePolling } from "../../../hooks/usePolling";
import { useEmaHistory } from "../../../hooks/useEmaHistory";
import { formatCountdown } from "../../../utils/time";
import { fetchHospitalDashboard } from "../../../services/dashboard/dashboardService";
import type { HospitalDashboardResponse } from "../../../services/dashboard/types";

const riskStyle = (risk: string) => {
  if (risk === "high") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (risk === "medium") return "bg-yellow-500/15 text-yellow-100 border-yellow-500/30";
  return "bg-emerald-500/15 text-emerald-100 border-emerald-500/30";
};

export default function HospitalDashboardPage() {
  const [tripId, setTripId] = useState("demo-trip");
  const [data, setData] = useState<HospitalDashboardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const etaHistory = useEmaHistory(data?.eta_final_sec ?? null, 8);

  usePolling(async () => {
    try {
      setErr(null);
      const res = await fetchHospitalDashboard(tripId);
      setData(res);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    }
  }, 2500, [tripId]);

  const spike =
    etaHistory.length >= 2 &&
    etaHistory[etaHistory.length - 1] - etaHistory[etaHistory.length - 2] >= 120;

  const countdown = data?.countdown_sec ?? 0;
  const status = countdown <= 0 ? "ARRIVED" : countdown <= 120 ? "NEAR ARRIVAL" : "EN ROUTE";

  const startSec = data?.eta_baseline_sec ?? data?.eta_final_sec ?? 1;
  const pct = startSec > 0 ? Math.min(100, Math.max(0, (1 - countdown / startSec) * 100)) : 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Live ETA, delay risk, and readiness guidance (auto refresh)
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-400">Status</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
              {status}
            </span>
            {spike && (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100">
                Delay spike detected
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LivePill lastUpdated={data?.last_updated} />

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-glow">
            <div className="text-[11px] text-zinc-400">Trip ID</div>
            <input
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="bg-transparent outline-none text-sm w-56 text-white placeholder:text-zinc-500"
              placeholder="demo-trip"
            />
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(tripId)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition"
          >
            Copy Trip
          </button>

          <button
            onClick={() => {
              const msg = `Ambulance ETA: ${data?.eta_final_sec ?? "-"}s | Risk: ${(
                data?.delay_risk ?? "low"
              ).toUpperCase()}`;
              navigator.clipboard.writeText(msg);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10 transition"
          >
            Copy ETA Msg
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
          <div className="font-semibold">Dashboard error</div>
          <div className="text-sm mt-1 opacity-90">{err}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Countdown */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm text-zinc-400">Arrival Countdown</div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight">
            {formatCountdown(data?.countdown_sec ?? 0)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Last update: {data?.last_updated ? new Date(data.last_updated).toLocaleTimeString() : "-"}
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-cyan-400/80" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 text-xs text-zinc-400">
            ETA trend:{" "}
            <span className="text-zinc-200">
              {etaHistory.length
                ? etaHistory.map((v) => Math.round(v / 60)).join(" -> ") + " (min)"
                : "-"}
            </span>
          </div>
        </div>

        {/* Risk */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm text-zinc-400">Delay Risk</div>
          <div className="mt-3">
            <span
              className={[
                "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                riskStyle(data?.delay_risk || "low"),
              ].join(" ")}
            >
              {(data?.delay_risk || "low").toUpperCase()}
            </span>
          </div>
          <div className="mt-3 text-xs text-zinc-400">
            Risk is computed from ML delay / route conditions.
          </div>
        </div>

        {/* ETA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm text-zinc-400">Final ETA</div>
          <div className="mt-3 text-3xl font-bold">{data?.eta_final_sec ?? 0}s</div>
          <div className="mt-3 text-xs text-zinc-400">
            Baseline: <span className="text-zinc-200">{data?.eta_baseline_sec ?? "-"}</span>{" "}
            | Pred delay: <span className="text-zinc-200">{data?.delay_pred_sec ?? "-"}</span>
          </div>
          {spike && <div className="mt-2 text-xs text-amber-200">Delay spike detected</div>}
        </div>
      </div>

      {/* Suggestion */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-zinc-400">Prep Suggestion</div>
            <div className="mt-2 text-lg font-semibold">{data?.prep_suggestion || "-"}</div>
            <div className="mt-1 text-sm text-zinc-400">
              This is rule-based guidance for safe hospital readiness.
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400">
            Mode: <span className="text-zinc-200">Live</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

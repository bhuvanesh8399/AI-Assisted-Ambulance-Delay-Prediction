import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../components/layout/AppShell";
import { useFrontendLocale } from "../../../hooks/useFrontendLocale";
import { useLiveStatus } from "../../../hooks/useLiveStatus";
import { fetchTrafficDashboard } from "../../../services/dashboard/dashboardService";
import type { TrafficDashboardResponse } from "../../../services/dashboard/types";
import { connectTripWS } from "../../../services/realtime";
import type { RealtimeMode } from "../../../services/realtime";

type DemoVariant = "normal" | "delay" | "near-arrival" | "reroute";

function liveStateClass(liveState: "live" | "stale" | "offline") {
  if (liveState === "live") return "live-banner__status live-banner__status--live";
  if (liveState === "stale") return "live-banner__status live-banner__status--stale";
  return "live-banner__status live-banner__status--offline";
}

function riskChip(risk: string) {
  if (risk === "high") return "status-chip status-chip--high";
  if (risk === "medium") return "status-chip status-chip--medium";
  return "status-chip status-chip--low";
}

export default function TrafficDashboardPage() {
  const [tripId, setTripId] = useState("demo-trip");
  const [data, setData] = useState<TrafficDashboardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [mode, setMode] = useState<RealtimeMode>("polling");
  const [pollingMs, setPollingMs] = useState(3000);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [variant, setVariant] = useState<DemoVariant>("normal");
  const { locale, setLocale } = useFrontendLocale("en");

  const fetchPolling = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetchTrafficDashboard(tripId);
      setData(res);
      setLastUpdated(Date.now());
    } catch (error: any) {
      setErr(error?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tripId || mode !== "polling") return;
    fetchPolling();
    const timer = window.setInterval(fetchPolling, pollingMs);
    return () => window.clearInterval(timer);
  }, [tripId, mode, pollingMs]);

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
  const filtered = onlyHigh ? junctions.filter((junction) => junction.priority === "high") : junctions;
  const now = Date.now();
  const next = filtered.find((junction) => new Date(junction.window_end).getTime() > now) || null;
  const nextInSec = next ? Math.max(0, Math.floor((new Date(next.window_start).getTime() - now) / 1000)) : null;

  const { liveState, ageMs } = useLiveStatus({
    lastUpdatedAt: lastUpdated || null,
    staleAfterMs: pollingMs * 2,
    offlineAfterMs: pollingMs * 6,
  });

  const surfaceLiveState = liveState === "LIVE" ? "live" : liveState === "STALE" ? "stale" : "offline";

  const scenario = useMemo(() => {
    if (variant === "near-arrival") {
      return { nextJunction: "Hospital Entry Gate", nextWindow: 52, distance: "1.1 km", speed: "20 km/h", delay: "0m" };
    }
    if (variant === "delay") {
      return { nextJunction: next?.name ?? "Collector Office Junction", nextWindow: Math.max(45, (nextInSec ?? 240) - 60), distance: "7.4 km", speed: "28 km/h", delay: "5m" };
    }
    if (variant === "reroute") {
      return { nextJunction: "Court Road Split", nextWindow: 258, distance: "8.4 km", speed: "36 km/h", delay: "3m" };
    }
    return { nextJunction: next?.name ?? "Collector Office Junction", nextWindow: nextInSec ?? 240, distance: "6.8 km", speed: "42 km/h", delay: "2m" };
  }, [next?.name, nextInSec, variant]);

  const alerts = [
    err
      ? { id: "error", tone: "HIGH", title: "Dashboard error", message: err, time: "Now" }
      : null,
    {
      id: "window",
      tone: scenario.nextWindow < 180 ? "HIGH" : "INFO",
      title: "Next corridor window",
      message: `${scenario.nextJunction} opens in ${Math.floor(scenario.nextWindow / 60)}m ${scenario.nextWindow % 60}s.`,
      time: ageMs === null ? "Pending" : `${Math.floor(ageMs / 1000)}s ago`,
    },
    {
      id: "fallback",
      tone: "WARN",
      title: "Fallback reminder",
      message: "Voice confirmation is still required if the feed drifts stale.",
      time: "Active",
    },
  ].filter(Boolean) as Array<{ id: string; tone: "HIGH" | "INFO" | "WARN"; title: string; message: string; time: string }>;

  return (
    <AppShell
      title="Traffic Control Dashboard"
      eyebrow="Green Corridor Operations View"
      liveState={surfaceLiveState}
      locale={locale}
      onLocaleChange={setLocale}
    >
      <div className="page-wrap">
        <section className="glass-card section-card live-banner">
          <div className="control-row">
            <div className={liveStateClass(surfaceLiveState)}>{surfaceLiveState.toUpperCase()}</div>
            <div className="meta-copy">
              Last update: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Waiting"} • Source: {mode === "ws" ? "WebSocket" : "Polling"} • {tripId}
            </div>
          </div>
          <div className="meta-copy">Graceful fallback ready • Corridor timings still allow phone confirmation</div>
        </section>

        <section className="glass-card section-card">
          <div className="section-title">Demo Control Bar</div>
          <div className="section-copy">Keep the dashboard live by default and layer presentation-safe scenarios on top.</div>
          <div className="control-row" style={{ marginTop: 12 }}>
            <input value={tripId} onChange={(event) => setTripId(event.target.value)} className="demo-input" placeholder="Enter trip ID" />
            <button type="button" className="demo-btn demo-btn--primary" onClick={fetchPolling} disabled={loading}>
              {loading ? "Loading..." : "Load Trip"}
            </button>
            <select value={pollingMs} onChange={(event) => setPollingMs(Number(event.target.value))} className="demo-select">
              <option value={2000}>Poll 2s</option>
              <option value={3000}>Poll 3s</option>
              <option value={5000}>Poll 5s</option>
              <option value={10000}>Poll 10s</option>
            </select>
            <select value={mode} onChange={(event) => setMode(event.target.value as RealtimeMode)} className="demo-select">
              <option value="polling">Polling</option>
              <option value="ws">WebSocket</option>
            </select>
            <button type="button" className={`demo-btn ${demoMode ? "demo-btn--primary" : ""}`} onClick={() => setDemoMode((value) => !value)}>
              {demoMode ? "Demo Mode ON" : "Demo Mode OFF"}
            </button>
            <select value={variant} onChange={(event) => setVariant(event.target.value as DemoVariant)} className="demo-select">
              <option value="normal">Normal</option>
              <option value="delay">Simulate Delay</option>
              <option value="near-arrival">Near Arrival</option>
              <option value="reroute">Change Destination</option>
            </select>
            <button type="button" className={`demo-btn ${onlyHigh ? "demo-btn--primary" : ""}`} onClick={() => setOnlyHigh((value) => !value)}>
              {onlyHigh ? "Showing HIGH only" : "Filter HIGH only"}
            </button>
          </div>
        </section>

        <div className="grid-hero">
          <section className="glass-card section-card">
            <div className="hero-card__eyebrow">
              <span className="hero-card__pulse" />
              <span>Traffic Control View</span>
            </div>
            <div className="hero-card__main">
              <div className="hero-card__trip">
                <h2>{variant === "reroute" ? "District Headquarters Hospital" : "Government Medical College Hospital"}</h2>
                <p>Ambulance Command Unit • {tripId} • ADVISORY CORRIDOR SUPPORT</p>
              </div>
              <div className="hero-card__eta">
                <div className="metric-label">Next Window</div>
                <div className="hero-card__eta-value">
                  {Math.floor(scenario.nextWindow / 60)}m {scenario.nextWindow % 60}s
                </div>
                <div className="meta-copy">Approach node {scenario.nextJunction} • Delay allowance {scenario.delay}</div>
              </div>
            </div>
            <div className="chip-row" style={{ marginTop: 18 }}>
              <span className={riskChip(data?.delay_risk ?? "low")}>{(data?.delay_risk ?? "low").toUpperCase()} RISK</span>
              <span className="status-chip status-chip--low">Distance {scenario.distance}</span>
              <span className="status-chip status-chip--medium">Speed {scenario.speed}</span>
              <span className="status-chip status-chip--low">Node {scenario.nextJunction}</span>
            </div>
          </section>

          <section className="glass-card section-card">
            <div className="section-title">Traffic Command Summary</div>
            <div className="keyline-list" style={{ marginTop: 12 }}>
              <div className="list-item">Next Junction: {scenario.nextJunction}</div>
              <div className="list-item">Priority Window: {Math.floor(scenario.nextWindow / 60)}m {scenario.nextWindow % 60}s</div>
              <div className="list-item">Traffic Risk: {(data?.delay_risk ?? "low").toUpperCase()}</div>
              <div className="list-item">Operational Mode: Advisory corridor support</div>
            </div>
          </section>
        </div>

        <div className="metric-grid">
          <section className="glass-card section-card">
            <div className="metric-label">Next Window</div>
            <div className="metric-value">{Math.floor(scenario.nextWindow / 60)}m {scenario.nextWindow % 60}s</div>
            <div className="meta-copy">Approach node: {scenario.nextJunction}</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Route Delay</div>
            <div className="metric-value">+{scenario.delay}</div>
            <div className="meta-copy">Recommended timing allowance above baseline</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Vehicle Speed</div>
            <div className="metric-value">{scenario.speed}</div>
            <div className="meta-copy">Latest corridor speed snapshot</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Route Remaining</div>
            <div className="metric-value">{scenario.distance}</div>
            <div className="meta-copy">Distance left to destination hospital</div>
          </section>
        </div>

        <div className="content-grid">
          <section className="glass-card section-card">
            <div className="section-title">Route & Live Position</div>
            <div className="section-copy">Styled placeholder panel. Replace this with the live Leaflet route layer when geometry wiring is ready.</div>
            <div className="map-placeholder" style={{ marginTop: 16 }} />
          </section>

          <div className="side-stack">
            <section className="glass-card section-card">
              <div className="section-title">Corridor Timeline</div>
              <div className="timeline-list" style={{ marginTop: 12 }}>
                {filtered.length ? (
                  filtered.map((junction, index) => (
                    <div key={`${junction.name}-${index}`} className="list-item">
                      <strong>{junction.name}</strong> • {new Date(junction.window_start).toLocaleTimeString()} - {new Date(junction.window_end).toLocaleTimeString()}
                      <div className="item-copy">
                        {junction.priority === "high"
                          ? "Manual clearing recommended for this junction window."
                          : "Maintain advisory corridor support and monitor flow."}
                      </div>
                      <div className="meta-copy">{junction.priority.toUpperCase()}</div>
                    </div>
                  ))
                ) : (
                  <div className="list-item">
                    <strong>No corridor plan received yet.</strong>
                    <div className="item-copy">Planner output is not available from the backend for this trip.</div>
                  </div>
                )}
              </div>
            </section>

            <section className="glass-card section-card">
              <div className="section-title">Operational Alert Feed</div>
              <div className="feed-list" style={{ marginTop: 12 }}>
                {alerts.map((alert) => (
                  <div key={alert.id} className="list-item">
                    <strong>{alert.tone}</strong> • {alert.title}
                    <div className="item-copy">{alert.message}</div>
                    <div className="meta-copy">{alert.time}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

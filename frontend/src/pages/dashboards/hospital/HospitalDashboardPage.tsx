import { useEffect, useMemo, useState } from "react";
import AppShell from "../../../components/layout/AppShell";
import { useFrontendLocale } from "../../../hooks/useFrontendLocale";
import { useLiveStatus } from "../../../hooks/useLiveStatus";
import { fetchHospitalDashboard } from "../../../services/dashboard/dashboardService";
import type { HospitalDashboardResponse } from "../../../services/dashboard/types";
import { connectTripWS } from "../../../services/realtime";
import type { RealtimeMode } from "../../../services/realtime";
import { formatCountdown } from "../../../utils/time";

type DemoVariant = "normal" | "delay" | "near-arrival" | "reroute";

function statusChipClass(risk: string) {
  if (risk === "high") return "status-chip status-chip--high";
  if (risk === "medium") return "status-chip status-chip--medium";
  return "status-chip status-chip--low";
}

function liveStateClass(liveState: "live" | "stale" | "offline") {
  if (liveState === "live") return "live-banner__status live-banner__status--live";
  if (liveState === "stale") return "live-banner__status live-banner__status--stale";
  return "live-banner__status live-banner__status--offline";
}

export default function HospitalDashboardPage() {
  const [tripId, setTripId] = useState("demo-trip");
  const [data, setData] = useState<HospitalDashboardResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
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
      const res = await fetchHospitalDashboard(tripId);
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
        if (msg?.type === "hospital_dashboard") {
          setData(msg.data);
          setLastUpdated(Date.now());
        }
      },
      () => setMode("polling")
    );
    return cleanup;
  }, [tripId, mode]);

  const { liveState, ageMs } = useLiveStatus({
    lastUpdatedAt: data?.last_updated ?? (lastUpdated || null),
    staleAfterMs: pollingMs * 2,
    offlineAfterMs: pollingMs * 6,
  });

  const surfaceLiveState = liveState === "LIVE" ? "live" : liveState === "STALE" ? "stale" : "offline";
  const countdown = data?.countdown_sec ?? 0;
  const baselineMinutes = Math.max(1, Math.round((data?.eta_baseline_sec ?? data?.eta_final_sec ?? 60) / 60));
  const delayMinutes = Math.max(0, Math.round((data?.delay_pred_sec ?? 0) / 60));

  const scenario = useMemo(() => {
    const destinationHospital = variant === "reroute" ? "District Headquarters Hospital" : "Government Medical College Hospital";
    if (!demoMode) {
      return {
        destinationHospital,
        status: countdown <= 0 ? "ARRIVED" : countdown <= 120 ? "NEAR ARRIVAL" : "EN ROUTE",
        finalCountdown: countdown,
        finalDelayMinutes: delayMinutes,
      };
    }

    if (variant === "delay") {
      return {
        destinationHospital,
        status: "EN ROUTE",
        finalCountdown: countdown + 180,
        finalDelayMinutes: Math.max(delayMinutes, 5),
      };
    }

    if (variant === "near-arrival") {
      return {
        destinationHospital,
        status: "NEAR ARRIVAL",
        finalCountdown: Math.min(countdown || 180, 180),
        finalDelayMinutes: 0,
      };
    }

    if (variant === "reroute") {
      return {
        destinationHospital,
        status: "EN ROUTE",
        finalCountdown: countdown + 120,
        finalDelayMinutes: Math.max(delayMinutes, 3),
      };
    }

    return {
      destinationHospital,
      status: countdown <= 0 ? "ARRIVED" : countdown <= 120 ? "NEAR ARRIVAL" : "EN ROUTE",
      finalCountdown: countdown,
      finalDelayMinutes: delayMinutes,
    };
  }, [baselineMinutes, countdown, delayMinutes, demoMode, variant]);

  const alerts = [
    err
      ? { id: "error", tone: "HIGH", title: "Dashboard error", message: err, time: "Now" }
      : null,
    {
      id: "prep",
      tone: (data?.delay_risk ?? "low") === "high" ? "HIGH" : "INFO",
      title: "Prep guidance",
      message: data?.prep_suggestion ?? "Normal prep: monitor ETA",
      time: ageMs === null ? "Pending" : `${Math.floor(ageMs / 1000)}s ago`,
    },
    {
      id: "fallback",
      tone: "WARN",
      title: "Fallback readiness",
      message: "Phone coordination remains the backup when the feed turns stale.",
      time: "Active",
    },
  ].filter(Boolean) as Array<{ id: string; tone: "HIGH" | "INFO" | "WARN"; title: string; message: string; time: string }>;

  const corridor = [
    {
      id: "j1",
      junction: variant === "reroute" ? "Court Road Split" : "Collector Office Junction",
      etaWindow: `${Math.max(1, Math.floor(scenario.finalCountdown / 60))}m`,
      note: "Prepare downstream receiving sequence against this approach window.",
      priority: data?.delay_risk ?? "low",
    },
    {
      id: "j2",
      junction: "Hospital Entry Gate",
      etaWindow: `${Math.max(1, Math.floor(scenario.finalCountdown / 60) + 2)}m`,
      note: "Keep handover lane and emergency bay clear for transfer.",
      priority: scenario.status === "NEAR ARRIVAL" ? "high" : "medium",
    },
  ];

  return (
    <AppShell
      title="Hospital Dashboard"
      eyebrow="Destination-Aware Emergency Monitoring"
      liveState={surfaceLiveState}
      locale={locale}
      onLocaleChange={setLocale}
    >
      <div className="page-wrap">
        <section className="glass-card section-card live-banner">
          <div className="control-row">
            <div className={liveStateClass(surfaceLiveState)}>{surfaceLiveState.toUpperCase()}</div>
            <div className="meta-copy">
              Last update: {data?.last_updated ? new Date(data.last_updated).toLocaleTimeString() : "Waiting"} •
              Source: {mode === "ws" ? "WebSocket" : "Polling"} • {tripId}
            </div>
          </div>
          <div className="meta-copy">Graceful fallback ready • Phone coordination remains backup</div>
        </section>

        <section className="glass-card section-card">
          <div className="section-title">Demo Control Bar</div>
          <div className="section-copy">Use live backend data by default and toggle UI-only scenarios when presenting.</div>
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
          </div>
        </section>

        <div className="grid-hero">
          <section className="glass-card section-card">
            <div className="hero-card__eyebrow">
              <span className="hero-card__pulse" />
              <span>Hospital Operations View</span>
            </div>
            <div className="hero-card__main">
              <div className="hero-card__trip">
                <h2>{scenario.destinationHospital}</h2>
                <p>Ambulance Command Unit • {tripId} • {scenario.status}</p>
              </div>
              <div className="hero-card__eta">
                <div className="metric-label">Final ETA</div>
                <div className="hero-card__eta-value">{formatCountdown(scenario.finalCountdown)}</div>
                <div className="meta-copy">Baseline {baselineMinutes}m + AI delay {scenario.finalDelayMinutes}m</div>
              </div>
            </div>
            <div className="chip-row" style={{ marginTop: 18 }}>
              <span className={statusChipClass(data?.delay_risk ?? "low")}>{(data?.delay_risk ?? "low").toUpperCase()} RISK</span>
              <span className="status-chip status-chip--low">Distance {variant === "near-arrival" ? "1.1 km" : "6.8 km"}</span>
              <span className="status-chip status-chip--medium">Speed {variant === "delay" ? "28 km/h" : "42 km/h"}</span>
              <span className="status-chip status-chip--low">Next Window {Math.max(1, Math.floor(scenario.finalCountdown / 60))}m</span>
            </div>
          </section>

          <div className="side-stack">
            <section className="glass-card section-card">
              <div className="section-title">Hospital Readiness</div>
              <div className="keyline-list" style={{ marginTop: 12 }}>
                <div className="list-item">Destination Hospital: {scenario.destinationHospital}</div>
                <div className="list-item">Ambulance Status: {scenario.status}</div>
                <div className="list-item">Acknowledgement State: {variant === "near-arrival" ? "PREPARING" : "ACKNOWLEDGED"}</div>
                <div className="list-item">Recommended Prep Mode: {scenario.status === "NEAR ARRIVAL" ? "Active handover readiness" : "Desk preparation"}</div>
              </div>
            </section>
            <section className="glass-card section-card">
              <div className="section-title">AI Delay Explanation</div>
              <div className="keyline-list" style={{ marginTop: 12 }}>
                <div className="list-item">Peak congestion pressure is raising the predicted delay above route baseline.</div>
                <div className="list-item">Upcoming junction density increases corridor sensitivity for coordinated clearing.</div>
                <div className="list-item">The ETA model is flagging elevated operational risk on the current approach.</div>
              </div>
            </section>
          </div>
        </div>

        <div className="metric-grid">
          <section className="glass-card section-card">
            <div className="metric-label">Final ETA</div>
            <div className="metric-value">{formatCountdown(scenario.finalCountdown)}</div>
            <div className="meta-copy">AI-adjusted arrival • {Math.max(1, Math.round(scenario.finalCountdown / 60))} min remaining</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Baseline ETA</div>
            <div className="metric-value">{baselineMinutes}m</div>
            <div className="meta-copy">OSRM route estimate before delay correction</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Predicted Delay</div>
            <div className="metric-value">+{scenario.finalDelayMinutes}m</div>
            <div className="meta-copy">AI-added delay from traffic and route pressure</div>
          </section>
          <section className="glass-card section-card">
            <div className="metric-label">Readiness</div>
            <div className="metric-value">{variant === "near-arrival" ? "ACTIVE" : "MONITOR"}</div>
            <div className="meta-copy">{data?.prep_suggestion ?? "Normal prep: monitor ETA"}</div>
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

            <section className="glass-card section-card">
              <div className="section-title">Corridor Timeline</div>
              <div className="timeline-list" style={{ marginTop: 12 }}>
                {corridor.map((item) => (
                  <div key={item.id} className="list-item">
                    <strong>{item.junction}</strong> • {item.etaWindow}
                    <div className="item-copy">{item.note}</div>
                    <div className="meta-copy">{item.priority.toUpperCase()}</div>
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

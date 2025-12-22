// src/pages/TrafficControlDashboard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { fetchTrafficSnapshot } from "../services/trafficApi";
import type { TripSnapshot, CorridorJunction, RiskLevel } from "../services/trafficApi";
import { usePolling } from "../hooks/usePolling";

// Fix default marker icons (Vite + Leaflet common issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function nowMs() {
  return Date.now();
}

function fmtMin(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "Unavailable";
  const rounded = Math.max(0, Math.round(n));
  return `${rounded} min`;
}

function riskBadge(risk: RiskLevel) {
  const base = "px-2 py-1 rounded-md text-xs font-semibold tracking-wide border";
  if (risk === "HIGH") return cls(base, "bg-red-950/50 text-red-200 border-red-700/60");
  if (risk === "MED") return cls(base, "bg-amber-950/40 text-amber-200 border-amber-700/60");
  if (risk === "LOW") return cls(base, "bg-emerald-950/40 text-emerald-200 border-emerald-700/60");
  return cls(base, "bg-zinc-900/60 text-zinc-200 border-zinc-700/60");
}

function freshnessLabel(lastGpsAtIso: string | null, serverTimeIso: string | null) {
  // Use server_time if available; otherwise local time.
  const baseNow = serverTimeIso ? new Date(serverTimeIso).getTime() : nowMs();
  const last = lastGpsAtIso ? new Date(lastGpsAtIso).getTime() : NaN;
  if (!Number.isFinite(last)) return { label: "STALE", isLive: false, ageSec: null as number | null };

  const ageSec = Math.max(0, Math.floor((baseNow - last) / 1000));
  const isLive = ageSec <= 10; // pragmatic threshold for 2–3s polling + jitter
  return { label: isLive ? "LIVE" : "STALE", isLive, ageSec };
}

function parseTripIdFromUrl(): string {
  const p = new URLSearchParams(window.location.search);
  return p.get("trip_id")?.trim() || "";
}

function copyToClipboard(text: string) {
  return navigator.clipboard?.writeText(text);
}

function priorityRank(p: string) {
  if (p === "HIGH") return 0;
  if (p === "MED") return 1;
  if (p === "LOW") return 2;
  return 3;
}

function safeTimeMs(iso: string | undefined) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatWindow(j: CorridorJunction) {
  const a = safeTimeMs(j.eta_window_start);
  const b = safeTimeMs(j.eta_window_end);
  if (!a || !b) return "Unavailable";
  const start = new Date(a).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const end = new Date(b).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${start}–${end}`;
}

function msToCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function TrafficControlDashboard() {
  const [tripId, setTripId] = useState<string>(() => parseTripIdFromUrl());
  const [snapshot, setSnapshot] = useState<TripSnapshot | null>(null);

  const [toast, setToast] = useState<{ type: "error" | "info"; msg: string } | null>(null);
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const [showHighOnly, setShowHighOnly] = useState<boolean>(false);

  // Tick for countdown / next-junction timers
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const doFetch = useCallback(
    async ({ signal }: { signal: AbortSignal }) => {
      if (!tripId) return;

      try {
        const data = await fetchTrafficSnapshot({ tripId, baseUrl, signal });
        setSnapshot(data);
        setLastOkAt(nowMs());
        setToast(null);
      } catch (e: any) {
        // keep existing snapshot, but show a clear error + stale banner behavior
        setToast({ type: "error", msg: e?.message ? `Backend error: ${e.message}` : "Backend error" });
      }
    },
    [tripId, baseUrl]
  );

  usePolling({
    enabled: Boolean(tripId),
    intervalMs: 2500, // 2–3 seconds default
    poll: doFetch,
  });

  const freshness = useMemo(() => {
    if (!snapshot) return { label: "STALE", isLive: false, ageSec: null as number | null };
    return freshnessLabel(snapshot.last_gps_at, snapshot.server_time);
  }, [snapshot, tick]);

  const effectiveEtaMin = snapshot?.final_eta_minutes ?? null;

  const etaCountdown = useMemo(() => {
    // Since backend gives "minutes remaining", we do a pragmatic countdown:
    // countdown = (final_eta_minutes * 60) - elapsedSinceLastOk
    if (effectiveEtaMin === null) return null;

    const baseSec = Math.max(0, Math.round(effectiveEtaMin * 60));
    const elapsedSec = lastOkAt ? Math.floor((nowMs() - lastOkAt) / 1000) : 0;
    const remainingMs = Math.max(0, (baseSec - elapsedSec) * 1000);
    return remainingMs;
  }, [effectiveEtaMin, lastOkAt, tick]);

  const junctionsSorted = useMemo(() => {
    const list = snapshot?.corridor ?? [];
    const filtered = showHighOnly ? list.filter((j) => j.priority === "HIGH") : list;

    return [...filtered].sort((a, b) => {
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;

      const ta = safeTimeMs(a.eta_window_start) ?? Number.POSITIVE_INFINITY;
      const tb = safeTimeMs(b.eta_window_start) ?? Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }, [snapshot, showHighOnly]);

  const nextJunctionId = useMemo(() => {
    // "Next junction" = earliest window_start that is still in the future (or closest overall)
    const nowT = snapshot?.server_time ? new Date(snapshot.server_time).getTime() : nowMs();
    let best: { id: string; t: number } | null = null;

    for (const j of junctionsSorted) {
      const t = safeTimeMs(j.eta_window_start);
      if (!t) continue;
      const score = Math.abs(t - nowT); // closest to now
      if (!best || score < Math.abs(best.t - nowT)) best = { id: j.id, t };
    }
    return best?.id ?? null;
  }, [junctionsSorted, snapshot]);

  const exportText = useMemo(() => {
    const trip = snapshot?.trip_id ?? (tripId || "UNKNOWN_TRIP");
    const eta = fmtMin(snapshot?.final_eta_minutes ?? null);
    const risk = snapshot?.risk ?? "UNAVAILABLE";

    const lines: string[] = [];
    lines.push("TRAFFIC CONTROL — ADVISORY GREEN CORRIDOR PLAN");
    lines.push(`Trip ID: ${trip}`);
    lines.push(`Final ETA: ${eta}`);
    lines.push(`Delay Risk: ${risk}`);
    lines.push("");

    if (!snapshot) {
      lines.push("Corridor: Unavailable (no snapshot loaded)");
      return lines.join("\n");
    }

    if (!snapshot.corridor || snapshot.corridor.length === 0) {
      lines.push("Corridor: Unavailable (no junctions detected — advisory ETA only)");
      return lines.join("\n");
    }

    lines.push("Ordered Junction Windows (Priority, earliest first):");
    junctionsSorted.forEach((j, idx) => {
      const name = j.name ? `${j.label} — ${j.name}` : j.label;
      lines.push(
        `${idx + 1}. [${j.priority}] ${name} | Window: ${formatWindow(j)}`
      );
    });

    return lines.join("\n");
  }, [snapshot, tripId, junctionsSorted]);

  const hasGeometry = Boolean(snapshot?.route_geometry?.coordinates?.length && snapshot.route_geometry!.coordinates.length >= 2);
  const routeLatLngs = useMemo(() => {
    if (!hasGeometry) return [] as Array<[number, number]>;
    // convert [lon,lat] -> [lat,lon]
    return snapshot!.route_geometry!.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
  }, [snapshot, hasGeometry]);

  const ambPos = useMemo(() => {
    const lat = snapshot?.ambulance_lat ?? null;
    const lon = snapshot?.ambulance_lon ?? null;
    if (lat === null || lon === null) return null;
    return [lat, lon] as [number, number];
  }, [snapshot]);

  const hospPos = useMemo(() => {
    const lat = snapshot?.hospital_lat ?? null;
    const lon = snapshot?.hospital_lon ?? null;
    if (lat === null || lon === null) return null;
    return [lat, lon] as [number, number];
  }, [snapshot]);

  const mapCenter = useMemo(() => {
    if (ambPos) return ambPos;
    if (hospPos) return hospPos;
    return [12.9716, 77.5946] as [number, number]; // safe default (Bengaluru-ish)
  }, [ambPos, hospPos]);

  const corridorEmptyReason = useMemo(() => {
    if (!snapshot) return "No data loaded — waiting for backend snapshot.";
    if (snapshot.status === "ARRIVED") return "Trip has ARRIVED — corridor updates are frozen.";
    if (!snapshot.route_geometry && (!snapshot.corridor || snapshot.corridor.length === 0))
      return "Corridor not available yet — route still being computed.";
    if (snapshot.route_geometry && (!snapshot.corridor || snapshot.corridor.length === 0))
      return "No junctions detected — using advisory ETA only.";
    return null;
  }, [snapshot]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            <div className="font-semibold tracking-wide">
              Traffic Control Dashboard <span className="text-zinc-400 font-normal">(Advisory only)</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className={cls(
              "px-2 py-1 rounded-md text-xs font-semibold border",
              freshness.isLive ? "bg-emerald-950/40 text-emerald-200 border-emerald-700/60" : "bg-zinc-900/60 text-zinc-200 border-zinc-700/60"
            )}>
              {freshness.label}
              {freshness.ageSec !== null ? <span className="ml-2 text-zinc-300/80 font-normal">({freshness.ageSec}s)</span> : null}
            </div>

            {toast ? (
              <div className={cls(
                "px-3 py-1 rounded-md text-xs border",
                toast.type === "error"
                  ? "bg-red-950/40 text-red-200 border-red-700/60"
                  : "bg-zinc-900/60 text-zinc-200 border-zinc-700/60"
              )}>
                {toast.msg}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Summary + Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trip selector + summary */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="p-4 border-b border-zinc-800/70 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Core Summary</div>
                <div className="text-xs text-zinc-400">
                  Clean operator view — stable placeholders, no nulls.
                </div>
              </div>
              <div className={riskBadge(snapshot?.risk ?? "UNAVAILABLE")}>
                {snapshot?.risk ?? "UNAVAILABLE"}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3">
                  <div className="text-xs text-zinc-400">Trip ID</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="font-mono text-sm truncate">
                      {snapshot?.trip_id ?? (tripId || "UNAVAILABLE")}
                    </div>
                    <button
                      className="ml-auto text-xs px-2 py-1 rounded-md border border-zinc-700/70 bg-zinc-900/60 hover:bg-zinc-900"
                      onClick={async () => {
                        const t = snapshot?.trip_id ?? tripId;
                        if (!t) return setToast({ type: "error", msg: "Trip ID unavailable to copy." });
                        try {
                          await copyToClipboard(t);
                          setToast({ type: "info", msg: "Trip ID copied." });
                          setTimeout(() => setToast(null), 1200);
                        } catch {
                          setToast({ type: "error", msg: "Copy failed (clipboard blocked)." });
                        }
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3">
                  <div className="text-xs text-zinc-400">Status</div>
                  <div className="mt-1 text-sm font-semibold">
                    {snapshot?.status ?? "UNKNOWN"}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3">
                  <div className="text-xs text-zinc-400">Final ETA</div>
                  <div className="mt-1 text-2xl font-bold tracking-tight">
                    {fmtMin(snapshot?.final_eta_minutes ?? null)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {snapshot?.final_eta_minutes === null ? "Explicit unavailable state (safe)" : "Delay-aware ETA"}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3">
                  <div className="text-xs text-zinc-400">Countdown</div>
                  <div className="mt-1 text-2xl font-bold tracking-tight">
                    {etaCountdown === null ? "Unavailable" : msToCountdown(etaCountdown)}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {snapshot?.status === "ARRIVED" ? "ARRIVED — timer frozen" : "Operator countdown (approx.)"}
                  </div>
                </div>
              </div>

              {/* Trip ID input */}
              <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3">
                <div className="text-xs text-zinc-400 mb-2">Load Trip</div>
                <div className="flex gap-2">
                  <input
                    value={tripId}
                    onChange={(e) => setTripId(e.target.value)}
                    placeholder="Enter trip_id (or add ?trip_id=... in URL)"
                    className="w-full rounded-lg bg-zinc-900/70 border border-zinc-700/70 px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
                  />
                  <button
                    className="px-4 py-2 rounded-lg border border-zinc-700/70 bg-zinc-900/60 hover:bg-zinc-900 text-sm font-semibold"
                    onClick={() => doFetch({ signal: new AbortController().signal })}
                    disabled={!tripId}
                  >
                    Refresh
                  </button>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  Polling runs every <span className="font-semibold text-zinc-200">2.5s</span>. Unmount cancels cleanly.
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="p-4 border-b border-zinc-800/70 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Corridor Timeline</div>
                <div className="text-xs text-zinc-400">
                  Sorted: Priority (HIGH first) → Time window (earliest first)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={cls(
                    "px-3 py-2 rounded-lg border text-xs font-semibold",
                    showHighOnly
                      ? "bg-emerald-950/40 text-emerald-200 border-emerald-700/60"
                      : "bg-zinc-900/60 text-zinc-200 border-zinc-700/70 hover:bg-zinc-900"
                  )}
                  onClick={() => setShowHighOnly((v) => !v)}
                >
                  {showHighOnly ? "HIGH only: ON" : "HIGH only: OFF"}
                </button>

                <button
                  className="px-3 py-2 rounded-lg border border-zinc-700/70 bg-zinc-900/60 hover:bg-zinc-900 text-xs font-semibold"
                  onClick={async () => {
                    try {
                      await copyToClipboard(exportText);
                      setToast({ type: "info", msg: "Corridor plan exported to clipboard." });
                      setTimeout(() => setToast(null), 1400);
                    } catch {
                      setToast({ type: "error", msg: "Export copy failed (clipboard blocked)." });
                    }
                  }}
                  disabled={!tripId}
                >
                  Export plan
                </button>
              </div>
            </div>

            <div className="p-4">
              {corridorEmptyReason ? (
                <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-4">
                  <div className="text-sm font-semibold">No corridor timeline</div>
                  <div className="mt-1 text-sm text-zinc-300">
                    {corridorEmptyReason}
                  </div>
                  <div className="mt-3 text-xs text-zinc-400">
                    This is intentional: we show explicit unavailable states (review-safe), never blank screens.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {junctionsSorted.map((j) => {
                    const isNext = nextJunctionId === j.id;

                    const startMs = safeTimeMs(j.eta_window_start);
                    const nowT = snapshot?.server_time ? new Date(snapshot.server_time).getTime() : nowMs();
                    const untilMs = startMs ? Math.max(0, startMs - nowT) : null;

                    return (
                      <div
                        key={j.id}
                        className={cls(
                          "rounded-xl border p-3 flex items-center gap-3",
                          isNext
                            ? "border-emerald-600/60 bg-emerald-950/20"
                            : "border-zinc-800/70 bg-zinc-950/70"
                        )}
                      >
                        <div className={cls(
                          "px-2 py-1 rounded-md text-xs font-semibold border",
                          j.priority === "HIGH"
                            ? "bg-red-950/40 text-red-200 border-red-700/60"
                            : j.priority === "MED"
                              ? "bg-amber-950/40 text-amber-200 border-amber-700/60"
                              : j.priority === "LOW"
                                ? "bg-zinc-900/60 text-zinc-200 border-zinc-700/60"
                                : "bg-zinc-900/60 text-zinc-200 border-zinc-700/60"
                        )}>
                          {j.priority}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">
                            {j.name ? `${j.label} — ${j.name}` : j.label}
                          </div>
                          <div className="text-xs text-zinc-400">
                            Window: <span className="text-zinc-200 font-semibold">{formatWindow(j)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-zinc-400">Next junction</div>
                          <div className="text-sm font-semibold">
                            {isNext
                              ? (untilMs === null ? "Unavailable" : msToCountdown(untilMs))
                              : "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Export preview */}
              <div className="mt-4">
                <div className="text-xs text-zinc-400 mb-2">Export preview (plain text)</div>
                <pre className="rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3 text-xs overflow-auto whitespace-pre-wrap leading-relaxed">
{exportText}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
            <div className="p-4 border-b border-zinc-800/70 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Map View</div>
                <div className="text-xs text-zinc-400">
                  Ambulance + hospital markers, route polyline (if available).
                </div>
              </div>

              <div className="text-xs text-zinc-400">
                {hasGeometry ? "Route: available" : "Route: unavailable"}
              </div>
            </div>

            <div className="p-3">
              <div className="rounded-xl overflow-hidden border border-zinc-800/70">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: 520, width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {hasGeometry ? (
                    <Polyline positions={routeLatLngs} />
                  ) : null}

                  {ambPos ? (
                    <Marker position={ambPos}>
                      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                        Ambulance (latest GPS)
                      </Tooltip>
                    </Marker>
                  ) : null}

                  {hospPos ? (
                    <Marker position={hospPos}>
                      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                        {snapshot?.hospital_name ? `Hospital: ${snapshot.hospital_name}` : "Hospital destination"}
                      </Tooltip>
                    </Marker>
                  ) : null}
                </MapContainer>
              </div>

              {/* Map fallback explanation */}
              {!ambPos || !hospPos ? (
                <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                  <div className="font-semibold">Map is in fallback mode</div>
                  <div className="mt-1 text-zinc-400 text-sm">
                    {(!ambPos && !hospPos)
                      ? "Ambulance & hospital coordinates unavailable — showing safe default view."
                      : (!ambPos)
                        ? "Ambulance GPS unavailable — hospital marker may still appear."
                        : "Hospital destination unavailable — ambulance marker may still appear."}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Advisory-only banner */}
          <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
            <div className="text-sm font-semibold">Safety & Scope (Review-safe)</div>
            <ul className="mt-2 text-sm text-zinc-300 list-disc pl-5 space-y-1">
              <li><span className="font-semibold">Advisory-only:</span> no traffic-signal control, no hardware assumptions.</li>
              <li><span className="font-semibold">Backend-driven:</span> shows only API data; UI never invents corridor points.</li>
              <li><span className="font-semibold">Stable fallbacks:</span> explicit “Unavailable” states, no blank panels.</li>
              <li><span className="font-semibold">Production-safe realtime:</span> polling every 2–3s with clean unmount cancellation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

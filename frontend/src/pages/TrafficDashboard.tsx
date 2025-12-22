import { useTripRealtime } from "../hooks/useTripRealtime";

export default function TrafficDashboard({ tripId }: { tripId: string }) {
  const { snapshot, mode, setMode, canUseWs, isStale } = useTripRealtime(tripId);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2>Traffic Control Dashboard</h2>

        {/* Toggle — WS is optional */}
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>Realtime:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            disabled={!canUseWs}
          >
            <option value="polling">Polling (default)</option>
            <option value="ws">WebSocket (experimental)</option>
          </select>
        </label>

        {isStale && (
          <span style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #999" }}>
            STALE (fallback active)
          </span>
        )}
      </div>

      {/* Keep your existing UI unchanged — just feed it snapshot */}
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {snapshot ? JSON.stringify(snapshot, null, 2) : "Loading snapshot..."}
      </pre>
    </div>
  );
}

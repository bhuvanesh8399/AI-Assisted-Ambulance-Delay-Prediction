export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type LiveState = "LIVE" | "STALE" | "OFFLINE";
export type TripStatus = "EN_ROUTE" | "NEAR_ARRIVAL" | "ARRIVED" | "STOPPED";

export interface CorridorWindow {
  junction_name: string;
  eta_window_start: string;
  eta_window_end: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface TripEvent {
  code: string;
  label: string;
  ts: string;
  severity: "INFO" | "WARN" | "HIGH";
  message: string;
}

export interface TripSnapshot {
  trip_id: string;
  status: TripStatus;
  live_state: LiveState;
  last_update_at: string | null;
  ambulance_id: string;
  ambulance_label: string;
  destination_hospital_id: string;
  destination_hospital_name: string | null;
  current_lat: number | null;
  current_lon: number | null;
  destination_lat: number | null;
  destination_lon: number | null;
  speed_kmph: number | null;
  distance_remaining_km: number | null;
  eta_osrm_seconds: number;
  predicted_delay_seconds: number;
  eta_final_seconds: number;
  risk_level: RiskLevel;
  confidence_score: number;
  delay_reason: string;
  corridor_windows: CorridorWindow[];
  events: TripEvent[];
  gps_updates_count: number;
}

export async function fetchTripSnapshot(tripId: string): Promise<TripSnapshot> {
  const res = await fetch(`/api/trip/${tripId}/snapshot`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trip snapshot (${res.status})`);
  }
  return res.json();
}

export async function fetchDashboardSummary(hospitalId?: string): Promise<{ items: Array<Record<string, unknown>>; count: number }> {
  const q = hospitalId ? `?hospital_id=${encodeURIComponent(hospitalId)}` : "";
  const res = await fetch(`/api/dashboard/summary${q}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary (${res.status})`);
  }
  return res.json();
}

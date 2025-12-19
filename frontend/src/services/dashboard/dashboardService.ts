import type { HospitalDashboardResponse, TrafficDashboardResponse } from "./types";

const API_BASE = "/api/dashboard";

export async function fetchHospitalDashboard(tripId: string): Promise<HospitalDashboardResponse> {
  const res = await fetch(`${API_BASE}/hospital/${tripId}`);
  if (!res.ok) throw new Error(`Hospital dashboard failed: ${res.status}`);
  return res.json();
}

export async function fetchTrafficDashboard(tripId: string): Promise<TrafficDashboardResponse> {
  const res = await fetch(`${API_BASE}/traffic/${tripId}`);
  if (!res.ok) throw new Error(`Traffic dashboard failed: ${res.status}`);
  return res.json();
}

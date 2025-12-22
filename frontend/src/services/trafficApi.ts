// src/services/trafficApi.ts
export type RiskLevel = "LOW" | "MED" | "HIGH" | "UNAVAILABLE";
export type TripStatus = "EN_ROUTE" | "NEAR_ARRIVAL" | "ARRIVED" | "UNKNOWN";

export type JunctionPriority = "HIGH" | "MED" | "LOW" | "UNAVAILABLE";

export type CorridorJunction = {
  id: string;
  label: string; // "Junction 3" or "Left turn @ XYZ"
  name?: string; // optional human name
  eta_window_start?: string; // ISO string
  eta_window_end?: string; // ISO string
  priority: JunctionPriority;
};

export type RouteGeometry = {
  // GeoJSON-like: array of [lon,lat] coordinates
  coordinates: Array<[number, number]>;
};

export type TripSnapshot = {
  trip_id: string;
  status: TripStatus;

  final_eta_minutes: number | null; // may be null from backend; we normalize
  risk: RiskLevel;

  last_gps_at: string | null; // ISO string
  server_time: string | null; // ISO string (preferred if backend provides)
  started_at?: string | null;

  ambulance_lat: number | null;
  ambulance_lon: number | null;

  hospital_lat: number | null;
  hospital_lon: number | null;
  hospital_name: string | null;

  corridor: CorridorJunction[]; // normalize to []
  route_geometry?: RouteGeometry | null;
};

type RawAny = any;

const DEFAULT_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function safeRisk(v: any): RiskLevel {
  if (v === "LOW" || v === "MED" || v === "HIGH") return v;
  return "UNAVAILABLE";
}

function safeStatus(v: any): TripStatus {
  if (v === "EN_ROUTE" || v === "NEAR_ARRIVAL" || v === "ARRIVED") return v;
  return "UNKNOWN";
}

function safePriority(v: any): JunctionPriority {
  if (v === "HIGH" || v === "MED" || v === "LOW") return v;
  return "UNAVAILABLE";
}

function asIsoOrNull(v: any): string | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function asNumOrNull(v: any): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asStrOrNull(v: any): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function normalizeCorridor(list: any): CorridorJunction[] {
  if (!Array.isArray(list)) return [];
  return list.map((j: any, idx: number) => ({
    id: asStrOrNull(j?.id) ?? `j_${idx}`,
    label: asStrOrNull(j?.label) ?? `Step ${idx + 1}`,
    name: asStrOrNull(j?.name) ?? undefined,
    eta_window_start: asIsoOrNull(j?.eta_window_start ?? j?.window_start ?? j?.start) ?? undefined,
    eta_window_end: asIsoOrNull(j?.eta_window_end ?? j?.window_end ?? j?.end) ?? undefined,
    priority: safePriority(j?.priority),
  }));
}

function normalizeGeometry(g: any): RouteGeometry | null {
  const coords = g?.coordinates ?? g?.coords ?? null;
  if (!Array.isArray(coords)) return null;

  const cleaned: Array<[number, number]> = coords
    .map((p: any) => {
      const lon = asNumOrNull(p?.[0]);
      const lat = asNumOrNull(p?.[1]);
      if (lon === null || lat === null) return null;
      return [lon, lat] as [number, number];
    })
    .filter(Boolean) as Array<[number, number]>;

  return cleaned.length >= 2 ? { coordinates: cleaned } : null;
}

/**
 * Snapshot endpoint strategy:
 * - Prefer a single snapshot endpoint that returns trip + corridor + geometry.
 * - If your backend uses different URLs, update only the `fetchTrafficSnapshot` URL.
 */
export async function fetchTrafficSnapshot(opts: {
  tripId: string;
  baseUrl?: string;
  signal?: AbortSignal;
}): Promise<TripSnapshot> {
  const baseUrl = opts.baseUrl ?? DEFAULT_BASE;

  // ✅ Adjust this path to match your backend.
  // Recommended: GET /api/traffic/snapshot?trip_id=...
  const url = `${baseUrl}/api/traffic/snapshot?trip_id=${encodeURIComponent(opts.tripId)}`;

  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) {
    throw new Error(`Snapshot fetch failed (${res.status})`);
  }

  const raw: RawAny = await res.json();

  // Some backends wrap payload
  const data = raw?.data ?? raw;

  const normalized: TripSnapshot = {
    trip_id: asStrOrNull(data?.trip_id) ?? opts.tripId,
    status: safeStatus(data?.status),

    final_eta_minutes: asNumOrNull(data?.final_eta_minutes ?? data?.final_eta ?? data?.eta_minutes),
    risk: safeRisk(data?.risk ?? data?.delay_risk),

    last_gps_at: asIsoOrNull(data?.last_gps_at ?? data?.gps?.last_gps_at),
    server_time: asIsoOrNull(data?.server_time ?? data?.now ?? raw?.server_time),
    started_at: asIsoOrNull(data?.started_at),

    ambulance_lat: asNumOrNull(data?.ambulance_lat ?? data?.gps?.lat ?? data?.current_lat),
    ambulance_lon: asNumOrNull(data?.ambulance_lon ?? data?.gps?.lon ?? data?.current_lon),

    hospital_lat: asNumOrNull(data?.hospital_lat ?? data?.hospital?.lat),
    hospital_lon: asNumOrNull(data?.hospital_lon ?? data?.hospital?.lon),
    hospital_name: asStrOrNull(data?.hospital_name ?? data?.hospital?.name),

    corridor: normalizeCorridor(data?.corridor ?? data?.corridor_plan ?? data?.junctions),
    route_geometry: normalizeGeometry(data?.route_geometry ?? data?.geometry ?? data?.route),
  };

  return normalized;
}
